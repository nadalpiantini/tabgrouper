// Rules engine for Tab Grouper
// Manages categorization rules and grouping logic

export const COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

// Common second-level domains for normalization
const COMMON_SLD = new Set(["co.uk", "com.br", "com.ar", "com.mx", "com.do", "com.co"]);

// Smart Rules Configuration
export const CONFIG_DEFAULT = {
  normalizeSubdomains: true,
  whitelist: ["drive.google.com"],
  blacklistIgnore: ["chrome://", "about:", "blob:", "data:"],
  groupMaxTabs: 30,
  autoCollapseAfterMerge: true,
  preset: "Empleaido",
  presets: {
    Empleaido: [
      { test: /notion|docs\.google|drive\.google|sheets\.google|evernote/, group: "📑 Docs", color: "yellow" },
      { test: /openai|chatgpt|claude|anthropic|gemini/, group: "🤖 AI", color: "purple" },
      { test: /github|cursor|stackblitz|gitlab|bitbucket|stackoverflow/, group: "💻 Code", color: "cyan" },
      { test: /youtube|vimeo|twitch/, group: "🎥 Video", color: "red" },
      { test: /mail\.google|outlook|proton/, group: "📬 Mail", color: "green" },
      { test: /twitter|x\.com|reddit|instagram|linkedin|facebook/, group: "📱 Social", color: "orange" }
    ]
  }
};

// Get configuration from storage
export async function getConfig() {
  const { config } = await chrome.storage.sync.get("config");
  return config || CONFIG_DEFAULT;
}

// Save configuration to storage
export async function setConfig(cfg) {
  await chrome.storage.sync.set({ config: cfg });
}

// Extract base hostname with subdomain normalization
export function baseHost(url, normalize = true) {
  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }

  if (!normalize) return hostname;

  const parts = hostname.split(".");
  if (parts.length <= 2) return hostname;

  // Handle common second-level domains (co.uk, com.br, etc.)
  const sld = parts.slice(-2).join(".");
  if (COMMON_SLD.has(sld)) {
    return parts.slice(-3).join(".");
  }

  // Default: return last 2 parts (example.com from app.example.com)
  return parts.slice(-2).join(".");
}

// Check if URL should be ignored
export function isIgnored(url, cfg) {
  if (!url) return true;
  if (cfg.blacklistIgnore.some(p => url.startsWith(p))) return true;
  return false;
}

// Match URL against preset rules
export function matchPreset(url, cfg) {
  const rules = cfg.presets[cfg.preset] || [];
  for (const r of rules) {
    if (r.test.test(url)) {
      return { group: r.group, color: r.color };
    }
  }
  return null;
}

// Default rules for category-based grouping
export const DEFAULT_RULES = [
  { test: /youtube|vimeo|twitch/, group: "🎥 Video", color: "red" },
  { test: /notion|docs\.google|drive\.google|evernote/, group: "📑 Docs", color: "yellow" },
  { test: /openai|chatgpt|claude|gemini|anthropic/, group: "🤖 AI", color: "purple" },
  { test: /mail\.google|outlook|proton/, group: "📬 Mail", color: "blue" },
  { test: /github|gitlab|bitbucket|stackoverflow/, group: "💻 Code", color: "cyan" },
  { test: /twitter|x\.com|linkedin|facebook|instagram/, group: "📱 Social", color: "green" }
];

// Load custom rules from storage
export async function loadRules() {
  const { customRules } = await chrome.storage.sync.get({ customRules: [] });
  return [...DEFAULT_RULES, ...customRules];
}

// Save custom rules to storage
export async function saveRules(customRules) {
  await chrome.storage.sync.set({ customRules });
}

// Categorize a tab based on rules
export async function categorizeTab(tab, mode) {
  try {
    const url = new URL(tab.url);
    const hostname = url.hostname;

    if (mode === "domain") {
      return { key: hostname, color: null };
    }

    if (mode === "category") {
      const rules = await loadRules();

      for (const rule of rules) {
        if (rule.test.test(hostname)) {
          return { key: rule.group, color: rule.color };
        }
      }

      return { key: "🌐 Other", color: "grey" };
    }
  } catch (e) {
    console.warn("Invalid URL:", tab.url);
    return null;
  }
}

// Main grouping function
export async function groupTabs(options = {}) {
  const {
    windowId = null,
    windowOnly = true,
    ignorePinned = true,
    mode = 'domain'
  } = options;

  // Save undo snapshot before grouping
  await saveUndoSnapshot(windowId);

  // Query tabs
  const queryOptions = windowId && windowOnly ? { windowId } : {};
  const tabs = await chrome.tabs.query(queryOptions);

  const groups = {};

  // Categorize tabs
  for (const tab of tabs) {
    // Skip pinned tabs if option enabled
    if (ignorePinned && tab.pinned) continue;

    // Skip already grouped tabs to avoid re-grouping
    if (tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE) continue;

    const category = await categorizeTab(tab, mode);
    if (!category) continue;

    const { key, color } = category;

    if (!groups[key]) {
      groups[key] = { tabIds: [], color };
    }
    groups[key].tabIds.push(tab.id);
  }

  // Create groups
  const groupKeys = Object.keys(groups);
  for (let i = 0; i < groupKeys.length; i++) {
    const key = groupKeys[i];
    const { tabIds, color } = groups[key];

    if (tabIds.length === 0) continue;

    const groupId = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(groupId, {
      title: key,
      color: color || COLORS[i % COLORS.length],
      collapsed: false
    });
  }

  return groupKeys.length;
}

// Ungroup all tabs in a window
export async function ungroupAll(windowId) {
  const tabs = await chrome.tabs.query({ windowId });

  const groupedTabs = tabs.filter(
    tab => tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE
  );

  if (groupedTabs.length === 0) return 0;

  const tabIds = groupedTabs.map(t => t.id);
  await chrome.tabs.ungroup(tabIds);

  return groupedTabs.length;
}

// Collapse all groups in a window
export async function collapseAllGroups(windowId) {
  const tabs = await chrome.tabs.query({ windowId });
  const groupIds = [...new Set(
    tabs
      .map(t => t.groupId)
      .filter(id => id !== chrome.tabGroups.TAB_GROUP_ID_NONE)
  )];

  for (const groupId of groupIds) {
    await chrome.tabGroups.update(groupId, { collapsed: true });
  }

  return groupIds.length;
}

// Undo system: Save snapshot before grouping
async function saveUndoSnapshot(windowId) {
  const tabs = await chrome.tabs.query(windowId ? { windowId } : {});

  const snapshot = {
    timestamp: Date.now(),
    windowId,
    tabs: tabs.map(t => ({
      id: t.id,
      groupId: t.groupId,
      pinned: t.pinned
    }))
  };

  await chrome.storage.local.set({ undoSnapshot: snapshot });
}

// Undo last grouping operation
export async function undoLastGroup() {
  const { undoSnapshot } = await chrome.storage.local.get({ undoSnapshot: null });

  if (!undoSnapshot) {
    console.warn("No undo snapshot available");
    return false;
  }

  // Restore previous state
  for (const tabInfo of undoSnapshot.tabs) {
    try {
      if (tabInfo.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE) {
        // Was ungrouped, ungroup it
        await chrome.tabs.ungroup([tabInfo.id]);
      }
    } catch (e) {
      console.warn("Could not restore tab:", tabInfo.id, e);
    }
  }

  // Clear snapshot after use
  await chrome.storage.local.remove('undoSnapshot');
  return true;
}

// Merge all Chrome windows into current window
export async function mergeAllWindows(ignorePinned = true) {
  const allWindows = await chrome.windows.getAll({ populate: true });
  
  if (allWindows.length === 1) {
    console.log("Only one window exists, nothing to merge");
    return 0;
  }

  const currentWindow = await chrome.windows.getCurrent();
  const targetWindowId = currentWindow.id;
  
  let mergedCount = 0;

  for (const window of allWindows) {
    if (window.id === targetWindowId) continue;
    
    const tabs = await chrome.tabs.query({ windowId: window.id });
    const tabsToMove = tabs.filter(tab => !ignorePinned || !tab.pinned);
    
    if (tabsToMove.length === 0) continue;
    
    const tabIds = tabsToMove.map(t => t.id);
    
    try {
      await chrome.tabs.move(tabIds, {
        windowId: targetWindowId,
        index: -1
      });

      mergedCount++;

      // Chrome automatically closes windows when all tabs are moved
      // No need to manually remove the window
    } catch (e) {
      // Only log if it's not a "window not found" error (which is expected)
      if (!e.message.includes('No window with id')) {
        console.error("Error moving tabs from window:", window.id, e);
      }
    }
  }

  return mergedCount;
}

// Position a window using preset layout
export async function positionWindow(windowId, preset) {
  try {
    const { WindowLayoutManager } = await import('./window-layouts.js');
    const manager = new WindowLayoutManager();
    return await manager.applyWindowPosition(windowId, preset);
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    throw error;
  }
}

// Apply quick layout preset (dual, triple, quad, focus)
export async function applyQuickLayout(layoutType) {
  try {
    const { WindowLayoutManager } = await import('./window-layouts.js');
    const manager = new WindowLayoutManager();
    return await manager.applyQuickLayout(layoutType);
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    throw error;
  }
}

// Save current window layout
export async function saveWindowLayout(layoutName) {
  try {
    const { WindowLayoutManager } = await import('./window-layouts.js');
    const manager = new WindowLayoutManager();
    return await manager.saveLayout(layoutName, true);
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    throw error;
  }
}

// Load saved window layout
export async function loadWindowLayout(layoutName) {
  try {
    const { WindowLayoutManager } = await import('./window-layouts.js');
    const manager = new WindowLayoutManager();
    return await manager.loadLayout(layoutName);
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    throw error;
  }
}

// Get all saved layouts
export async function getWindowLayouts() {
  try {
    const { WindowLayoutManager } = await import('./window-layouts.js');
    const manager = new WindowLayoutManager();
    return await manager.getLayouts();
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    throw error;
  }
}

// Delete a saved layout
export async function deleteWindowLayout(layoutName) {
  try {
    const { WindowLayoutManager } = await import('./window-layouts.js');
    const manager = new WindowLayoutManager();
    return await manager.deleteLayout(layoutName);
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    throw error;
  }
}

// Check if DeskDriver is connected
export async function checkDeskDriver() {
  try {
    const { DeskDriverBridge } = await import('./window-layouts.js');
    const bridge = new DeskDriverBridge();
    return await bridge.checkConnection();
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    return false; // Return false instead of throwing - DeskDriver is optional
  }
}

// Apply DeskDriver profile (if available)
export async function applyDeskDriverProfile(profileName) {
  try {
    const { DeskDriverBridge } = await import('./window-layouts.js');
    const bridge = new DeskDriverBridge();
    const connected = await bridge.checkConnection();
    if (!connected) return false;
    return await bridge.applyProfile(profileName);
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    return false; // Return false instead of throwing - DeskDriver is optional
  }
}

// Get DeskDriver profiles (if available)
export async function getDeskDriverProfiles() {
  try {
    const { DeskDriverBridge } = await import('./window-layouts.js');
    const bridge = new DeskDriverBridge();
    const connected = await bridge.checkConnection();
    if (!connected) return {};
    return await bridge.getProfiles();
  } catch (error) {
    console.error('Error loading window-layouts module:', error);
    return {}; // Return empty object instead of throwing - DeskDriver is optional
  }
}

// Convert each group to a separate window
export async function groupsToWindows() {
  const currentWindow = await chrome.windows.getCurrent();
  const groups = await chrome.tabGroups.query({ windowId: currentWindow.id });
  
  if (groups.length === 0) {
    console.log("No groups to convert");
    return 0;
  }

  const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
  let createdCount = 0;

  for (const group of groups) {
    const groupTabs = allTabs.filter(t => t.groupId === group.id);
    
    if (groupTabs.length === 0) continue;
    
    try {
      // Create new window with first tab
      const newWindow = await chrome.windows.create({
        tabId: groupTabs[0].id,
        focused: false
      });
      
      // Move remaining tabs to new window
      if (groupTabs.length > 1) {
        const remainingTabIds = groupTabs.slice(1).map(t => t.id);
        await chrome.tabs.move(remainingTabIds, {
          windowId: newWindow.id,
          index: -1
        });
      }
      
      // Get all tabs in new window to recreate group
      const newWindowTabs = await chrome.tabs.query({ windowId: newWindow.id });
      const newTabIds = newWindowTabs.map(t => t.id);
      
      // Recreate group in new window
      const newGroupId = await chrome.tabs.group({
        tabIds: newTabIds,
        createProperties: { windowId: newWindow.id }
      });
      
      // Apply original group properties
      await chrome.tabGroups.update(newGroupId, {
        title: group.title,
        color: group.color,
        collapsed: group.collapsed
      });
      
      createdCount++;
    } catch (e) {
      console.error("Error creating window for group:", group.title, e);
    }
  }

  return createdCount;
}
