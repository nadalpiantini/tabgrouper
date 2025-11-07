// Side Panel for Tab Grouper
// Visual group management interface

const qs = (s) => document.querySelector(s);
let currentWinId = 0;
let renderThrottle = null;

// Safe hostname extraction with fallback
function safeHost(url) {
  try {
    const u = new URL(url || 'about:blank');
    return u.hostname || 'misc';
  } catch {
    return 'misc';
  }
}

// Throttled render to prevent flickering
function scheduleRender() {
  if (renderThrottle) cancelAnimationFrame(renderThrottle);
  renderThrottle = requestAnimationFrame(render);
}

async function getData() {
  const win = await chrome.windows.getCurrent();
  currentWinId = win.id;
  const groups = await chrome.tabGroups.query({ windowId: win.id });
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const byGroup = new Map();

  for (const t of tabs) {
    const g = t.groupId;
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(t);
  }

  return { groups, byGroup };
}

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstChild;
}

async function render() {
  try {
    const wrap = qs('#groups');
    wrap.innerHTML = '';
    const { groups, byGroup } = await getData();

  // "Ungrouped" = groupId -1
  const un = byGroup.get(chrome.tabGroups.TAB_GROUP_ID_NONE) || [];
  if (un.length) wrap.append(childForUngrouped(un));

  for (const g of groups) {
    const list = byGroup.get(g.id) || [];
    wrap.append(childForGroup(g, list));
  }
  } catch (e) {
    console.error('Render error:', e);
    const wrap = qs('#groups');
    wrap.innerHTML = '<div style="padding:12px;color:#ff6d9d;">⚠️ Error loading groups. Click Refresh.</div>';
  }
}

function childForUngrouped(tabs) {
  const c = el(`<article class="grp">
    <h3>🗂️ Ungrouped <span class="badge">${tabs.length}</span></h3>
    <div class="actions">
      <button data-act="group-ungrouped" class="action-btn">Group by Domain</button>
    </div>
  </article>`);

  c.querySelector('[data-act="group-ungrouped"]').onclick = () => groupUngroupedByDomain(tabs);
  return c;
}

function childForGroup(g, tabs) {
  const c = el(`<article class="grp">
    <h3>
      <span class="dot" style="background-color: var(--color-${g.color || 'grey'})"></span>
      ${g.title || 'Untitled'}
      <span class="badge">${tabs.length}</span>
    </h3>
    <div class="actions">
      <button data-act="collapse" class="action-btn-sm">Collapse</button>
      <button data-act="expand" class="action-btn-sm">Expand</button>
      <button data-act="rename" class="action-btn-sm">Rename</button>
      <button data-act="color" class="action-btn-sm">Color</button>
      <button data-act="merge-domain" class="action-btn-sm">Merge by Domain</button>
    </div>
    <ul class="tabs">${tabs.map(t => {
      const hostname = safeHost(t.url);
      const safeTitle = (t.title || 'Untitled').replace(/"/g, '&quot;');
      return `<li title="${safeTitle}">${hostname}</li>`;
    }).join('')}</ul>
  </article>`);

  const act = (sel, fn) => c.querySelector(sel).onclick = () => fn(g);

  act('[data-act="collapse"]', async (g) => {
    try {
      await chrome.tabGroups.update(g.id, { collapsed: true });
      scheduleRender();
    } catch (e) {
      console.error('Collapse error:', e);
    }
  });
  act('[data-act="expand"]', async (g) => {
    try {
      await chrome.tabGroups.update(g.id, { collapsed: false });
      scheduleRender();
    } catch (e) {
      console.error('Expand error:', e);
    }
  });
  act('[data-act="rename"]', async (g) => {
    const t = prompt('New name:', g.title || '');
    if (t !== null && t.trim()) {
      try {
        await chrome.tabGroups.update(g.id, { title: t.trim() });
        scheduleRender();
      } catch (e) {
        console.error('Rename error:', e);
      }
    }
  });
  act('[data-act="color"]', async (g) => {
    const validColors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    const c = prompt('Color (grey, blue, red, yellow, green, pink, purple, cyan, orange):', g.color || 'grey');
    if (c && validColors.includes(c.toLowerCase())) {
      try {
        await chrome.tabGroups.update(g.id, { color: c.toLowerCase() });
        scheduleRender();
      } catch (e) {
        console.error('Color change error:', e);
      }
    }
  });
  act('[data-act="merge-domain"]', () => mergeByDomain());

  return c;
}

async function groupUngroupedByDomain(tabs) {
  const buckets = {};

  for (const t of tabs) {
    const host = safeHost(t.url);
    (buckets[host] ??= []).push(t.id);
  }

  try {
    for (const host of Object.keys(buckets)) {
      const ids = buckets[host];
      if (!ids.length) continue;

      const gid = await chrome.tabs.group({ tabIds: ids });
      await chrome.tabGroups.update(gid, { title: host });
    }
    scheduleRender();
  } catch (e) {
    console.error('Group ungrouped error:', e);
    scheduleRender();
  }
}

async function mergeByDomain() {
  const tabs = await chrome.tabs.query({ windowId: currentWinId });
  const byHost = {};

  for (const t of tabs) {
    const host = safeHost(t.url);
    if (host === 'misc') continue; // Skip invalid URLs
    (byHost[host] ??= []).push(t.id);
  }

  try {
    for (const host of Object.keys(byHost)) {
      const ids = byHost[host];
      if (ids.length < 2) continue;

      const gid = await chrome.tabs.group({ tabIds: ids });
      await chrome.tabGroups.update(gid, { title: host });
    }
    scheduleRender();
  } catch (e) {
    console.error('Merge by domain error:', e);
    scheduleRender();
  }
}

// Global actions
qs('#collapse').onclick = async () => {
  try {
    const gs = await chrome.tabGroups.query({ windowId: currentWinId });
    await Promise.all(gs.map(g => chrome.tabGroups.update(g.id, { collapsed: true })));
    scheduleRender();
  } catch (e) {
    console.error('Collapse all error:', e);
  }
};

qs('#expand').onclick = async () => {
  try {
    const gs = await chrome.tabGroups.query({ windowId: currentWinId });
    await Promise.all(gs.map(g => chrome.tabGroups.update(g.id, { collapsed: false })));
    scheduleRender();
  } catch (e) {
    console.error('Expand all error:', e);
  }
};

qs('#refresh').onclick = () => scheduleRender();

// Initial render and auto-refresh on visibility change
render();
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) scheduleRender();
});

// === WORKSPACES PRO ===
import {
  captureWorkspace, saveWorkspaceNamed, listWorkspaces, getWorkspace, deleteWorkspace,
  renameWorkspace, duplicateWorkspace, exportWorkspace, exportAllWorkspaces,
  importWorkspacesFromText, getSettings, setSettings, listAutosaves,
  autosaveCurrentSession, restoreAutosave, restoreWorkspace, RESTORE_MODE
} from './workspace.js';

import { TEMPLATES } from './templates.js';
import { getConfig, setConfig } from './rules.js';

const statusEl = qs('#io-status');

function note(s) {
  statusEl.textContent = s;
  setTimeout(() => statusEl.textContent = '', 4000);
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Workspace Pro UI elements
const W = {
  name: qs('#ws-name'),
  tags: qs('#ws-tags'),
  notes: qs('#ws-notes'),
  includePinned: qs('#ws-include-pinned'),
  includeMeta: qs('#ws-include-meta'),
  list: qs('#ws-list'),
  preview: qs('#ws-preview'),
  restoreMode: qs('#ws-restore-mode'),
  autosave: qs('#ws-autosave'),
  autosaveMax: qs('#ws-autosave-max'),
  autosaves: qs('#ws-autosaves')
};

async function wsLoadSettings() {
  const s = await getSettings();
  W.includePinned.checked = !!s.includePinned;
  W.includeMeta.checked = !!s.includeMeta;
  W.autosave.checked = !!s.autosaveEnabled;
  W.autosaveMax.value = s.autosaveMax || 10;
}

async function wsSaveSettings() {
  const s = await getSettings();
  s.includePinned = W.includePinned.checked;
  s.includeMeta = W.includeMeta.checked;
  s.autosaveEnabled = W.autosave.checked;
  s.autosaveMax = Math.max(1, Math.min(50, parseInt(W.autosaveMax.value || "10", 10)));
  await setSettings(s);
}

async function wsRefreshList() {
  const arr = await listWorkspaces();
  W.list.innerHTML = '';
  arr.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (arr.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'No workspaces saved';
    opt.disabled = true;
    W.list.appendChild(opt);
    W.preview.textContent = '';
    return;
  }

  for (const w of arr) {
    const o = document.createElement('option');
    o.value = w.name;
    o.textContent = `${w.name} — ${w.stats.tabs}t / ${w.stats.groups}g`;
    W.list.appendChild(o);
  }

  if (arr[0]) {
    W.list.value = arr[0].name;
    wsShowPreview(arr[0].name);
  }
}

async function wsShowPreview(name) {
  const w = await getWorkspace(name);
  if (!w) {
    W.preview.textContent = '(no data)';
    return;
  }

  const { windows = [], tags = [], notes = "", stats } = w;
  const head = `${w.name} [${new Date(w.date).toLocaleString()}]
Tags: ${tags.join(', ') || '(none)'}
Notes: ${notes || '(none)'}
Stats: ${stats.tabs} tabs, ${stats.groups} groups, ${stats.windows} windows
`;

  let body = '';
  windows.forEach((win, i) => {
    body += `
[Window ${i + 1}] groups: ${win.groups.length} + ungrouped: ${win.ungrouped?.length || 0}
`;
    win.groups.forEach(g => {
      body += `  - ${g.title || '(untitled)'} (${g.color || 'grey'}) x${g.tabs.length}
`;
    });
  });

  W.preview.textContent = head + body;
}

async function wsRefreshAutosaves() {
  const arr = await listAutosaves();
  W.autosaves.innerHTML = '';

  if (arr.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'No autosaves';
    opt.disabled = true;
    W.autosaves.appendChild(opt);
    return;
  }

  arr.forEach((a, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `${i + 1}. ${a.name} — ${a.stats.tabs}t / ${a.stats.groups}g`;
    W.autosaves.appendChild(o);
  });
}

// Settings handlers
W.includePinned.onchange = wsSaveSettings;
W.includeMeta.onchange = wsSaveSettings;
W.autosave.onchange = wsSaveSettings;
W.autosaveMax.onchange = wsSaveSettings;

// Capture/save named workspace
qs('#ws-capture').onclick = async () => {
  try {
    await wsSaveSettings();
    const name = (W.name.value || 'Workspace').trim();
    const tags = (W.tags.value || '').split(',').map(s => s.trim()).filter(Boolean);
    const notes = W.notes.value || '';

    const snap = await captureWorkspace({ name, tags, notes });
    await saveWorkspaceNamed(snap);
    await wsRefreshList();
    
    W.name.value = '';
    W.tags.value = '';
    W.notes.value = '';
    
    note(`Workspace "${snap.name}" saved ✔︎`);
  } catch (e) {
    console.error('Capture workspace error:', e);
    note(`Save error: ${e.message}`);
  }
};

// Rename workspace
qs('#ws-rename').onclick = async () => {
  try {
    const cur = W.list.value;
    if (!cur || cur === 'No workspaces saved') return;

    const next = prompt('New name:', cur);
    if (!next || next === cur) return;

    await renameWorkspace(cur, next);
    await wsRefreshList();
    note('Renamed ✔︎');
  } catch (e) {
    console.error('Rename workspace error:', e);
    note(`Rename error: ${e.message}`);
  }
};

// Duplicate workspace
qs('#ws-duplicate').onclick = async () => {
  try {
    const cur = W.list.value;
    if (!cur || cur === 'No workspaces saved') return;

    const next = prompt('Name for duplicate:', `${cur} Copy`);
    if (!next) return;

    await duplicateWorkspace(cur, next);
    await wsRefreshList();
    note('Duplicated ✔︎');
  } catch (e) {
    console.error('Duplicate workspace error:', e);
    note(`Duplicate error: ${e.message}`);
  }
};

// Delete workspace
qs('#ws-delete').onclick = async () => {
  try {
    const cur = W.list.value;
    if (!cur || cur === 'No workspaces saved') return;

    if (!confirm(`Delete "${cur}"?`)) return;

    await deleteWorkspace(cur);
    await wsRefreshList();
    note('Deleted ✔︎');
  } catch (e) {
    console.error('Delete workspace error:', e);
    note(`Delete error: ${e.message}`);
  }
};

// Restore workspace
qs('#ws-restore').onclick = async () => {
  try {
    const mode = W.restoreMode.value;
    const cur = W.list.value;
    if (!cur || cur === 'No workspaces saved') return;

    await restoreWorkspace(cur, { mode });
    scheduleRender();
    note(`Restored "${cur}" in ${mode} mode ✔︎`);
  } catch (e) {
    console.error('Restore workspace error:', e);
    note(`Restore error: ${e.message}`);
  }
};

// Refresh list
qs('#ws-refresh-list').onclick = wsRefreshList;

// List change - show preview
W.list.onchange = () => {
  const name = W.list.value;
  if (name && name !== 'No workspaces saved') {
    wsShowPreview(name);
  }
};

// Manual autosave
qs('#ws-autosave-now').onclick = async () => {
  try {
    await autosaveCurrentSession();
    await wsRefreshAutosaves();
    note('Autosave created ✔︎');
  } catch (e) {
    console.error('Autosave error:', e);
    note(`Autosave error: ${e.message}`);
  }
};

// Restore autosave
qs('#ws-restore-autosave').onclick = async () => {
  try {
    const idx = parseInt(W.autosaves.value || "-1", 10);
    if (idx < 0 || W.autosaves.value === 'No autosaves') return;

    const mode = W.restoreMode.value;
    await restoreAutosave(idx, mode);
    scheduleRender();
    note('Autosave restored ✔︎');
  } catch (e) {
    console.error('Restore autosave error:', e);
    note(`Autosave error: ${e.message}`);
  }
};

// Load template
qs('#tpl-load').onclick = async () => {
  try {
    const key = qs('#tpl-select').value;
    const items = TEMPLATES[key] || [];

    for (const g of items) {
      const created = [];
      for (const t of g.tabs) {
        try {
          const tab = await chrome.tabs.create({ url: t.url, active: false });
          created.push(tab.id);
        } catch (e) {
          console.error('Failed to create tab:', t.url, e);
        }
      }

      if (created.length > 0) {
        const gid = await chrome.tabs.group({ tabIds: created });
        await chrome.tabGroups.update(gid, { title: g.title, color: g.color });
      }
    }

    scheduleRender();
    note(`Template "${key}" loaded ✔︎`);
  } catch (e) {
    console.error('Load template error:', e);
    note(`Template error: ${e.message}`);
  }
};

// Export selected workspace
qs('#export-selected').onclick = async () => {
  try {
    const name = qs('#ws-list').value;
    if (!name || name === 'No workspaces saved') {
      note('Select a workspace first');
      return;
    }

    const json = await exportSelectedWorkspace(name);
    download(`workspace_${name}.json`, json);
    note('Exported selected ✔︎');
  } catch (e) {
    console.error('Export selected error:', e);
    note(`Export error: ${e.message}`);
  }
};

// Export all workspaces
qs('#export-all').onclick = async () => {
  try {
    const json = await exportAllWorkspaces();
    download(`workspaces_all_${Date.now()}.json`, json);
    note('Exported all ✔︎');
  } catch (e) {
    console.error('Export all error:', e);
    note(`Export error: ${e.message}`);
  }
};

// Export current snapshot
qs('#export-current').onclick = async () => {
  try {
    const name = (qs('#ws-name').value || 'Snapshot').trim();
    const includeMeta = qs('#ws-include-meta').checked;
    const json = await exportCurrentSnapshotAsWorkspace(name, includeMeta);
    download(`workspace_snapshot_${Date.now()}.json`, json);
    note(`Snapshot exported (${includeMeta ? 'rich' : 'light'}) ✔︎`);
  } catch (e) {
    console.error('Export snapshot error:', e);
    note(`Export error: ${e.message}`);
  }
};

// Import workspaces
qs('#import-btn').onclick = () => {
  qs('#import-file').click();
};

qs('#import-file').onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const res = await importWorkspacesFromText(text);
    await refreshWorkspaces();
    
    if (res.errors.length > 0) {
      note(`Imported ${res.imported}, skipped ${res.skipped}. Check console for errors.`);
      console.warn('Import errors:', res.errors);
    } else {
      note(`Imported ${res.imported} workspace(s) ✔︎`);
    }
  } catch (err) {
    console.error('Import error:', err);
    note(`Import error: ${err.message}`);
  }

  e.target.value = ''; // Reset for re-import
};

// Initial Workspaces Pro load
(async () => {
  await wsLoadSettings();
  await wsRefreshList();
  await wsRefreshAutosaves();
})();

// === SMART RULES ===
async function loadSmartRules() {
  try {
    const cfg = await getConfig();
    qs('#sr-normalize').checked = !!cfg.normalizeSubdomains;
    qs('#sr-autocollapse').checked = !!cfg.autoCollapseAfterMerge;

    const sel = qs('#sr-preset');
    sel.innerHTML = '';
    Object.keys(cfg.presets).forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = k;
      sel.appendChild(o);
    });
    sel.value = cfg.preset;
  } catch (e) {
    console.error('Load smart rules error:', e);
  }
}

// Save normalize subdomain setting
qs('#sr-normalize').onchange = async (e) => {
  try {
    const cfg = await getConfig();
    cfg.normalizeSubdomains = e.target.checked;
    await setConfig(cfg);
    note('Subdomain merge ' + (e.target.checked ? 'enabled' : 'disabled') + ' ✔︎');
  } catch (e) {
    console.error('Save normalize error:', e);
  }
};

// Save preset selection
qs('#sr-preset').onchange = async (e) => {
  try {
    const cfg = await getConfig();
    cfg.preset = e.target.value;
    await setConfig(cfg);
    note(`Preset changed to ${e.target.value} ✔︎`);
  } catch (e) {
    console.error('Save preset error:', e);
  }
};

// Save auto-collapse setting
qs('#sr-autocollapse').onchange = async (e) => {
  try {
    const cfg = await getConfig();
    cfg.autoCollapseAfterMerge = e.target.checked;
    await setConfig(cfg);
    note('Auto-collapse ' + (e.target.checked ? 'enabled' : 'disabled') + ' ✔︎');
  } catch (e) {
    console.error('Save auto-collapse error:', e);
  }
};

// Edit whitelist
qs('#sr-edit-white').onclick = async () => {
  try {
    const cfg = await getConfig();
    const cur = (cfg.whitelist || []).join("
");
    const next = prompt("Whitelist (one per line, exact hostname):", cur);

    if (next !== null) {
      cfg.whitelist = next.split(/
+/).map(s => s.trim()).filter(Boolean);
      await setConfig(cfg);
      note("Whitelist saved ✔︎");
    }
  } catch (e) {
    console.error('Edit whitelist error:', e);
    note(`Whitelist error: ${e.message}`);
  }
};

// Apply Smart-Merge (via messaging to service worker)
qs('#sr-apply').onclick = () => {
  try {
    chrome.runtime.sendMessage({ type: "SMART_MERGE" }, (res) => {
      if (chrome.runtime.lastError) {
        note(`Smart-Merge error: ${chrome.runtime.lastError.message}`);
        return;
      }
      note(res?.ok ? "Smart-Merge applied ✔︎" : "Smart-Merge: no response");
      scheduleRender();
    });
  } catch (e) {
    console.error('Smart-Merge error:', e);
    note(`Smart-Merge error: ${e.message}`);
  }
};

// Initial smart rules load
loadSmartRules();
