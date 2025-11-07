// Service Worker for Tab Grouper
// Handles keyboard shortcuts and background operations

import { groupTabs, ungroupAll, collapseAllGroups, getConfig, setConfig, baseHost, isIgnored, matchPreset, COLORS } from './rules.js';
import { autosaveCurrentSession } from './workspace.js';

// Listen to keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const currentWindow = await chrome.windows.getCurrent();

  switch (command) {
    case 'group-tabs':
      await groupTabs({
        windowId: currentWindow.id,
        windowOnly: true,
        ignorePinned: true
      });
      await autosaveCurrentSession();
      break;

    case 'ungroup-tabs':
      await ungroupAll(currentWindow.id);
      await autosaveCurrentSession();
      break;

    case 'collapse-groups':
      await collapseAllGroups(currentWindow.id);
      break;

    case 'smart-merge':
      await smartMerge({
        windowId: currentWindow.id,
        windowOnly: true,
        ignorePinned: true
      });
      // smartMerge already calls autosave internally
      break;
  }
});

// Message handler for side panel communication
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "SMART_MERGE") {
        const win = await chrome.windows.getCurrent();
        await smartMerge({
          windowId: win.id,
          windowOnly: true,
          ignorePinned: true
        });
        sendResponse({ ok: true });
      } else if (msg?.type === "SPLIT_BIG_GROUPS") {
        const count = await splitBigGroups();
        sendResponse({ ok: true, split: count });
      } else {
        sendResponse({ ok: false, error: 'Unknown message type' });
      }
    } catch (e) {
      console.error('Message handler error:', e);
      sendResponse({ ok: false, error: e.message });
    }
  })();
  return true; // Keep message channel open for async response
});

// Split Big Groups - Divide groups exceeding max tabs limit
export async function splitBigGroups() {
  const cfg = await getConfig();
  const win = await chrome.windows.getCurrent();
  const allTabs = await chrome.tabs.query({ windowId: win.id });
  const groups = await chrome.tabGroups.query({ windowId: win.id });
  let affected = 0;

  for (const g of groups) {
    const ids = allTabs.filter(t => t.groupId === g.id).map(t => t.id);
    if (ids.length > cfg.groupMaxTabs) {
      // Ungroup first, then recreate with chunks
      await chrome.tabs.ungroup(ids);

      for (let i = 0; i < ids.length; i += cfg.groupMaxTabs) {
        const chunk = ids.slice(i, i + cfg.groupMaxTabs);
        const gid = await chrome.tabs.group({ tabIds: chunk });
        await chrome.tabGroups.update(gid, {
          title: `${g.title || 'Group'} (${Math.floor(i / cfg.groupMaxTabs) + 1})`,
          color: g.color
        });
      }
      affected++;
    }
  }

  await maybeAutoCollapse(win.id);
  await autosaveCurrentSession();
  return affected;
}

// Auto-collapse helper - Intelligent collapse based on config
async function maybeAutoCollapse(windowId) {
  const cfg = await getConfig();
  const groups = await chrome.tabGroups.query(windowId ? { windowId } : {});

  if (!cfg.autoCollapseAfterMerge && !cfg.autoCollapseByType?.enabled) return;

  if (cfg.autoCollapseByType?.enabled) {
    // Selective collapse by type
    const only = new Set(cfg.autoCollapseByType.only || []);
    for (const g of groups) {
      const title = g.title || '';
      const should = Array.from(only).some(lbl => title.startsWith(lbl));
      if (should) {
        await chrome.tabGroups.update(g.id, { collapsed: true });
      }
    }
  } else if (cfg.autoCollapseAfterMerge) {
    // Collapse all
    await Promise.all(groups.map(g => chrome.tabGroups.update(g.id, { collapsed: true })));
  }
}

// Smart Merge function - Intelligent grouping with rules engine
export async function smartMerge({ windowId = null, windowOnly = true, ignorePinned = true } = {}) {
  const cfg = await getConfig();
  const tabs = await chrome.tabs.query(windowOnly && windowId ? { windowId } : {});
  const buckets = new Map();

  for (const t of tabs) {
    if (ignorePinned && t.pinned) continue;
    if (isIgnored(t.url, cfg)) continue;

    // 1) Whitelist: exact hostname keeps separate bucket
    const host = (() => {
      try {
        return new URL(t.url).hostname;
      } catch {
        return null;
      }
    })();

    const whitelisted = host && cfg.whitelist.includes(host);

    // 2) Preset match
    const m = matchPreset(t.url, cfg);

    // 3) Base host (normalized if enabled)
    const bh = baseHost(t.url, cfg.normalizeSubdomains) || "misc";

    const key = whitelisted ? `WL:${host}` : (m ? `PX:${m.group}` : `BH:${bh}`);
    const title = whitelisted ? host : (m ? m.group : bh);
    const color = m?.color;

    if (!buckets.has(key)) {
      buckets.set(key, { title, color, tabIds: [] });
    }
    buckets.get(key).tabIds.push(t.id);
  }

  // Create groups with max tabs limit
  for (const { title, color, tabIds } of buckets.values()) {
    const chunks = [];
    for (let i = 0; i < tabIds.length; i += cfg.groupMaxTabs) {
      chunks.push(tabIds.slice(i, i + cfg.groupMaxTabs));
    }

    let idx = 1;
    for (const chunk of chunks) {
      const gid = await chrome.tabs.group({ tabIds: chunk });
      const c = COLORS.includes(color) ? color : undefined;
      const groupTitle = chunks.length > 1 ? `${title} (${idx++})` : title;

      await chrome.tabGroups.update(gid, {
        title: groupTitle,
        ...(c ? { color: c } : {})
      });
    }
  }

  // Auto-collapse using intelligent helper
  await maybeAutoCollapse(windowId);
  await autosaveCurrentSession();
}

// Open side panel on icon click (alternative to popup)
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: "sidepanel.html",
      enabled: true
    });
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (e) {
    console.warn("Could not open side panel:", e);
  }
});

// Installation handler
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Tab Grouper installed - Made with 🧠 by Empleaido');

    // Initialize config with coherent defaults from CONFIG_DEFAULT
    const cfg = await getConfig();
    await setConfig({
      ...cfg,
      normalizeSubdomains: cfg.normalizeSubdomains ?? true,
      whitelist: cfg.whitelist ?? ['drive.google.com'],
      blacklistIgnore: cfg.blacklistIgnore ?? ['chrome://', 'about:', 'blob:', 'data:'],
      groupMaxTabs: cfg.groupMaxTabs ?? 30,
      autoCollapseAfterMerge: cfg.autoCollapseAfterMerge ?? true,
      autoCollapseByType: cfg.autoCollapseByType ?? { enabled: false, only: ['🎥 Video', '📱 Social'] },
      preset: cfg.preset ?? 'Empleaido'
    });

    // Initialize legacy popup settings for backward compatibility
    await chrome.storage.sync.set({
      ignorePinned: true,
      windowOnly: true,
      mode: 'domain'
    });
  }
});