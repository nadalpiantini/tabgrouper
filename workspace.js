// Workspace management for Tab Grouper Pro v1.6.0
// Multi-window support, restore modes, autosave sessions, tags/notes

const SYNC_KEY = "workspaces";
const LOCAL_KEY = "workspace_autosaves";
const MAX_AUTOSAVES_DEFAULT = 10;

const COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];

export const RESTORE_MODE = {
  MERGE_CURRENT: "MERGE_CURRENT",
  NEW_WINDOW: "NEW_WINDOW",
  REPLACE_CURRENT: "REPLACE_CURRENT"
};

// Workspace settings
export async function getSettings() {
  const { ws_settings } = await chrome.storage.sync.get("ws_settings");
  return ws_settings || {
    includePinned: false,
    includeMeta: true,
    autosaveEnabled: true,
    autosaveMax: MAX_AUTOSAVES_DEFAULT
  };
}

export async function setSettings(next) {
  await chrome.storage.sync.set({ ws_settings: next });
}

// Helper functions
function buildTabRecord(tab, includeMeta) {
  const rec = { url: tab.url, pinned: !!tab.pinned };
  if (includeMeta) {
    rec.title = tab.title || "";
    rec.favicon = tab.favIconUrl || "";
  }
  return rec;
}

function nowISO() {
  return new Date().toISOString();
}

// Capture multi-window workspace
export async function captureWorkspace({ name, tags = [], notes = "" } = {}) {
  const settings = await getSettings();
  const wins = await chrome.windows.getAll({ populate: false });
  const data = [];

  for (const w of wins) {
    const tabs = await chrome.tabs.query({ windowId: w.id });
    const groups = await chrome.tabGroups.query({ windowId: w.id });

    const byGroup = new Map();
    for (const t of tabs) {
      if (!settings.includePinned && t.pinned) continue;
      const gid = t.groupId ?? chrome.tabGroups.TAB_GROUP_ID_NONE;
      if (!byGroup.has(gid)) byGroup.set(gid, []);
      byGroup.get(gid).push(buildTabRecord(t, settings.includeMeta));
    }

    const windowSnap = {
      bounds: {
        left: w.left,
        top: w.top,
        width: w.width,
        height: w.height,
        state: w.state
      },
      groups: [],
      ungrouped: byGroup.get(chrome.tabGroups.TAB_GROUP_ID_NONE) || []
    };

    for (const g of groups) {
      const gtabs = byGroup.get(g.id) || [];
      windowSnap.groups.push({
        title: g.title,
        color: g.color,
        tabs: gtabs
      });
    }

    data.push(windowSnap);
  }

  const snapshot = {
    name: name || `Workspace ${new Date().toLocaleString()}`,
    date: nowISO(),
    tags: Array.isArray(tags) ? tags : [],
    notes: String(notes || ""),
    windows: data,
    stats: summarizeSnapshot(data)
  };

  return snapshot;
}

function summarizeSnapshot(windows) {
  let groups = 0, tabs = 0;
  for (const w of windows) {
    groups += w.groups.length + (w.ungrouped?.length ? 1 : 0);
    tabs += w.ungrouped?.length || 0;
    for (const g of w.groups) tabs += g.tabs.length;
  }
  return { windows: windows.length, groups, tabs };
}

// Save workspace to storage
export async function saveWorkspaceNamed(snapshot) {
  const all = await getWorkspacesRaw();
  all.push(snapshot);
  await setWorkspacesRaw(all);
  return snapshot.name;
}

// Rename workspace
export async function renameWorkspace(oldName, newName) {
  const all = await getWorkspacesRaw();
  const i = all.findIndex(w => w.name === oldName);
  if (i < 0) return false;
  all[i].name = newName;
  await setWorkspacesRaw(all);
  return true;
}

// Duplicate workspace
export async function duplicateWorkspace(name, newName) {
  const all = await getWorkspacesRaw();
  const src = all.find(w => w.name === name);
  if (!src) return false;
  const copy = structuredClone(src);
  copy.name = newName;
  copy.date = nowISO();
  all.push(copy);
  await setWorkspacesRaw(all);
  return true;
}

// Delete workspace
export async function deleteWorkspace(name) {
  const all = await getWorkspacesRaw();
  await setWorkspacesRaw(all.filter(w => w.name !== name));
}

// List workspaces with optional tag filter
export async function listWorkspaces({ tag = null } = {}) {
  const all = await getWorkspacesRaw();
  const arr = all.map(w => ({
    name: w.name,
    date: w.date,
    tags: w.tags || [],
    stats: w.stats || summarizeSnapshot(w.windows || [])
  }));
  return tag ? arr.filter(w => w.tags.includes(tag)) : arr;
}

// Get single workspace
export async function getWorkspace(name) {
  const all = await getWorkspacesRaw();
  return all.find(w => w.name === name) || null;
}

// Get all workspaces raw
export async function getWorkspacesRaw() {
  const ws = (await chrome.storage.sync.get(SYNC_KEY))[SYNC_KEY] || [];
  return Array.isArray(ws) ? ws : [];
}

// Set workspaces raw
export async function setWorkspacesRaw(arr) {
  await chrome.storage.sync.set({ [SYNC_KEY]: arr });
}

// Autosave sessions (local storage)
export async function autosaveCurrentSession() {
  const settings = await getSettings();
  if (!settings.autosaveEnabled) return;

  const snap = await captureWorkspace({
    name: `Session ${new Date().toLocaleTimeString()}`
  });

  const { autosaves, max } = await getAutosavesRaw();
  const arr = [snap, ...autosaves].slice(0, max || MAX_AUTOSAVES_DEFAULT);
  await setAutosavesRaw(arr, max);
}

export async function getAutosavesRaw() {
  const res = await chrome.storage.local.get(LOCAL_KEY);
  const val = res[LOCAL_KEY] || {
    autosaves: [],
    max: MAX_AUTOSAVES_DEFAULT
  };
  if (!Array.isArray(val.autosaves)) val.autosaves = [];
  return val;
}

export async function setAutosavesRaw(autosaves, max) {
  await chrome.storage.local.set({
    [LOCAL_KEY]: {
      autosaves,
      max: max || MAX_AUTOSAVES_DEFAULT
    }
  });
}

export async function listAutosaves() {
  const { autosaves } = await getAutosavesRaw();
  return autosaves.map((w, i) => ({
    idx: i,
    name: w.name,
    date: w.date,
    stats: w.stats
  }));
}

export async function restoreAutosave(idx, mode = RESTORE_MODE.MERGE_CURRENT) {
  const { autosaves } = await getAutosavesRaw();
  const snap = autosaves[idx];
  if (!snap) throw new Error("Autosave not found");
  return restoreWorkspaceSnapshot(snap, { mode });
}

// Restore workspace by name
export async function restoreWorkspace(name, { mode = RESTORE_MODE.MERGE_CURRENT } = {}) {
  const snap = await getWorkspace(name);
  if (!snap) throw new Error("Workspace not found");
  return restoreWorkspaceSnapshot(snap, { mode });
}

// Restore workspace snapshot
export async function restoreWorkspaceSnapshot(snapshot, { mode = RESTORE_MODE.MERGE_CURRENT } = {}) {
  if (mode === RESTORE_MODE.NEW_WINDOW) {
    for (const w of snapshot.windows) {
      const win = await chrome.windows.create({
        focused: false,
        state: w.bounds?.state || "normal",
        width: w.bounds?.width,
        height: w.bounds?.height,
        left: w.bounds?.left,
        top: w.bounds?.top
      });
      await restoreWindowInto(win.id, w);
    }
    return true;
  }

  const cur = await chrome.windows.getCurrent();

  if (mode === RESTORE_MODE.REPLACE_CURRENT) {
    const tabs = await chrome.tabs.query({ windowId: cur.id });
    if (tabs.length) {
      await chrome.tabs.remove(tabs.map(t => t.id));
    }
  }

  for (const w of snapshot.windows) {
    await restoreWindowInto(cur.id, w);
  }

  return true;
}

async function restoreWindowInto(windowId, windowSnap) {
  const createdForGroup = async (tabsArr) => {
    const ids = [];
    for (const t of tabsArr) {
      try {
        const tab = await chrome.tabs.create({
          windowId,
          url: t.url,
          active: false,
          pinned: !!t.pinned
        });
        ids.push(tab.id);
      } catch (e) {
        console.error('Failed to create tab:', t.url, e);
      }
    }
    return ids;
  };

  if (windowSnap.ungrouped?.length) {
    await createdForGroup(windowSnap.ungrouped);
  }

  for (const g of windowSnap.groups) {
    const ids = await createdForGroup(g.tabs || []);
    if (!ids.length) continue;

    const gid = await chrome.tabs.group({
      tabIds: ids,
      createProperties: { windowId }
    });
    await chrome.tabGroups.update(gid, {
      title: g.title,
      color: g.color
    });
  }
}

// Validation functions
function validateTabRec(t) {
  if (!t || typeof t.url !== "string") return "Tab missing url";
  try {
    const u = new URL(t.url);
    if (!/^https?:$/.test(u.protocol)) return "Only http/https";
  } catch {
    return "Invalid URL";
  }
  return null;
}

function validateGroupRec(g) {
  if (!g || typeof g !== "object") return "Group invalid";
  if (g.color && !COLORS.includes(g.color)) return "Invalid color";
  if (!Array.isArray(g.tabs)) return "tabs must be array";
  for (const t of g.tabs) {
    const e = validateTabRec(t);
    if (e) return e;
  }
  return null;
}

function validateWindowRec(w) {
  if (!w || typeof w !== "object") return "Window invalid";
  if (!Array.isArray(w.groups) || !Array.isArray(w.ungrouped)) {
    return "groups/ungrouped must be arrays";
  }
  for (const g of w.groups) {
    const e = validateGroupRec(g);
    if (e) return e;
  }
  for (const t of w.ungrouped) {
    const e = validateTabRec(t);
    if (e) return e;
  }
  return null;
}

export function validateWorkspaceObject(obj) {
  if (!obj || typeof obj !== "object") return "Not an object";
  if (!obj.name) return "Missing name";
  if (!Array.isArray(obj.windows)) return "windows must be array";
  for (const w of obj.windows) {
    const e = validateWindowRec(w);
    if (e) return e;
  }
  return null;
}

// Export workspace
export async function exportWorkspace(name) {
  const snap = await getWorkspace(name);
  if (!snap) throw new Error("Workspace not found");
  return JSON.stringify({
    schema: "empleaido.tabgrouper.workspace.pro@1",
    exportedAt: nowISO(),
    data: snap
  }, null, 2);
}

// Export all workspaces
export async function exportAllWorkspaces() {
  const all = await getWorkspacesRaw();
  return JSON.stringify({
    schema: "empleaido.tabgrouper.workspace.list.pro@1",
    exportedAt: nowISO(),
    data: all
  }, null, 2);
}

// Import workspaces from JSON
export async function importWorkspacesFromText(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSON inválido");
  }

  const list = Array.isArray(parsed?.data)
    ? parsed.data
    : (parsed?.data ? [parsed.data] : (Array.isArray(parsed) ? parsed : null));

  if (!list) throw new Error("Estructura no reconocida");

  const ok = [], bad = [];
  for (const w of list) {
    const ws = w?.data ? w.data : w;
    const e = validateWorkspaceObject(ws);
    if (e) bad.push(`${ws?.name || 'Unnamed'}: ${e}`);
    else ok.push(ws);
  }

  if (!ok.length) {
    throw new Error(`Nada importado. Errores: ${bad.join("; ")}`);
  }

  const current = await getWorkspacesRaw();
  const names = new Set(current.map(w => w.name));

  for (const w of ok) {
    let base = w.name, i = 2;
    while (names.has(w.name)) w.name = `${base} (${i++})`;
    names.add(w.name);
    current.push(w);
  }

  await setWorkspacesRaw(current);
  return { imported: ok.length, skipped: bad.length, errors: bad };
}

// Legacy compatibility exports
export async function exportSelectedWorkspace(name) {
  return exportWorkspace(name);
}

export async function exportCurrentSnapshotAsWorkspace(name, includeMeta = true) {
  const settings = await getSettings();
  settings.includeMeta = includeMeta;
  await setSettings(settings);

  const snap = await captureWorkspace({ name: name || `Snapshot ${new Date().toLocaleString()}` });

  return JSON.stringify({
    schema: "empleaido.tabgrouper.workspace.pro@1",
    exportedAt: nowISO(),
    data: snap
  }, null, 2);
}
