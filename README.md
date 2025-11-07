# 🧠 Tab Grouper

> **Professional documentation**
> **Made with 🧠 by Empleaido** — Smart tools that scale

**Smart tab organization for Chrome** - Group your tabs by domain or category with keyboard shortcuts.

Made with 🧠 by [Empleaido](https://empleaido.com)

---

## ✨ Features

- **🧠 Smart Rules Engine**: Intelligent grouping with subdomain merging, presets, and whitelist
- **🎯 Smart Grouping**: Group by domain or intelligent categories
- **🎨 Visual Side Panel**: Real-time group management with live preview
- **💾 Workspaces Pro**: Multi-window sessions with tags, notes, and 3 restore modes
- **📦 Templates**: Pre-built workspace templates (Docs, AI, Code, Social, Empleaido)
- **⬇️⬆️ Export/Import**: Share workspaces via JSON files
- **⌨️ Keyboard Shortcuts**: Fast operations with Ctrl/Cmd+Shift+G/U/C
- **🪟 Window-Scoped**: Group only current window or all windows
- **📌 Ignore Pinned**: Keep pinned tabs ungrouped
- **↩️ Undo System**: Revert last grouping operation
- **💾 Persistent Settings**: Your preferences saved automatically
- **🎛️ Group Actions**: Collapse, expand, rename, recolor, and merge groups

## 🎨 Built-in Categories

- 🎥 **Video**: YouTube, Vimeo, Twitch
- 📑 **Docs**: Notion, Google Docs, Drive, Evernote
- 🤖 **AI**: ChatGPT, Claude, Gemini, OpenAI
- 📬 **Mail**: Gmail, Outlook, Protonmail
- 💻 **Code**: GitHub, GitLab, StackOverflow
- 📱 **Social**: Twitter, LinkedIn, Facebook, Instagram

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd+Shift+G` | Group tabs |
| `Ctrl/Cmd+Shift+U` | Ungroup all tabs |
| `Ctrl/Cmd+Shift+C` | Collapse all groups |
| `Ctrl/Cmd+Shift+M` | Smart-Merge (intelligent rules) |

## 🚀 Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `TabGrouper` folder

### Verify Installation

- Extension icon should appear in toolbar
- Click icon to open popup
- Test keyboard shortcuts

## 📖 Usage

### Via Side Panel (Recommended)

1. Click extension icon in toolbar to open side panel
2. **View and manage groups** in current window:
   - Color-coded group indicators
   - Tab counts per group
   - List of tabs in each group
3. **Manage individual groups**:
   - **Collapse/Expand**: Toggle individual groups
   - **Rename**: Change group title
   - **Color**: Pick from 9 colors
   - **Merge by Domain**: Combine tabs globally by domain
   - **Group Ungrouped**: Group ungrouped tabs by domain
4. **Use global actions**:
   - **Collapse All**: Collapse all groups
   - **Expand All**: Expand all groups
   - **Refresh**: Reload panel data

### Workspaces Pro

**Multi-window session management with tags and notes:**

1. **Save Workspace** (Multi-Window):
   - Enter workspace name and optional tags
   - Add notes for documentation
   - Toggle: Include pinned tabs / Include metadata
   - Click "💾 Save (multi-window)"
   - Captures ALL open windows with positions

2. **Restore Workspace** (3 Modes):
   - **Merge in Current**: Add to existing window
   - **Recreate in New Windows**: Restore each window separately
   - **Replace Current**: Clear current window, then restore
   - Select workspace → Choose mode → Click "♻️ Restore"

3. **Manage Workspaces**:
   - ✏️ **Rename**: Change workspace name
   - 🧬 **Duplicate**: Clone workspace
   - 🗑️ **Delete**: Remove with confirmation
   - 📊 **Preview**: View structure, tags, notes, stats

4. **Autosaves** (Local):
   - Enable autosave toggle
   - Set max autosaves (1-50)
   - Manual "⏺ Save now"
   - Restore from autosave list
   - Uses local storage (no sync quota)

### Smart Rules

**Intelligent grouping with advanced configuration:**

1. **Smart-Merge**:
   - Press `Ctrl/Cmd+Shift+M` or click "⚡ Smart-Merge" button
   - Uses preset rules for categorization
   - Merges subdomains automatically (configurable)
   - Respects whitelist for exceptions
   - Auto-splits groups over 30 tabs
   - Auto-collapses after merge (optional)

2. **Configuration Options**:
   - **Merge Subdomains**: `app.notion.so` → `notion.so`
   - **Preset**: Select rule configuration (currently "Empleaido")
   - **Whitelist**: Keep specific domains separate (e.g., `drive.google.com`)
   - **Auto-collapse**: Collapse all groups after Smart-Merge

3. **Edit Whitelist**:
   - Click "Whitelist" button
   - Enter hostnames (one per line)
   - Exact hostname matching

### Templates

**Quick-start with pre-built templates:**

1. Select template from dropdown:
   - **Docs**: Notion + Google Docs + Drive
   - **AI**: ChatGPT + Claude + Gemini
   - **Code**: GitHub + Cursor + StackBlitz
   - **Social**: Twitter + Reddit + YouTube
   - **Empleaido**: All categories combined

2. Click "📦 Load"
3. Template tabs and groups created instantly

### Export/Import

**Share workspaces with others or backup your configurations:**

1. **Export**:
   - **Export Selected**: Download one workspace as JSON
   - **Export All**: Download all workspaces as JSON
   - **Export Snapshot**: Save current state without persisting
   - Choose rich (with titles/favicons) or light (URLs only)

2. **Import**:
   - Click "⬆️ Import JSON"
   - Select JSON file
   - Workspaces validated and merged
   - Duplicate names auto-resolved

### Via Popup

1. Right-click extension icon → Select popup (or use from toolbar)
2. Choose grouping mode:
   - **Group by Domain**: Groups by website hostname
   - **Group by Category**: Uses smart categorization
3. Configure options:
   - ✅ **Only this window**: Group current window only
   - ✅ **Ignore pinned tabs**: Skip pinned tabs
4. Click **Group Tabs** button

### Via Keyboard

- Press `Ctrl+Shift+G` (or `Cmd+Shift+G` on Mac) to group tabs
- Press `Ctrl+Shift+U` to ungroup all
- Press `Ctrl+Shift+C` to collapse all groups

### Undo

- Click **Undo** button in popup to revert last grouping
- Only one level of undo available (latest operation)

## 🏗️ Architecture

```
TabGrouper/
├── manifest.json       # Chrome Extension manifest (MV3)
├── sw.js              # Service worker (command handlers)
├── rules.js           # Grouping logic & rules engine
├── workspace.js       # Workspace save/restore/export/import
├── templates.js       # Pre-built Empleaido templates
├── popup.html         # Quick access popup UI
├── popup.js           # Popup UI logic
├── sidepanel.html     # Side panel UI structure
├── sidepanel.js       # Side panel logic & workspace management
├── style.css          # Modern dark theme styling
└── icons/             # Extension icons (16/48/128)
```

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: `tabs`, `tabGroups`, `storage`, `sidePanel`
- **Storage**: Uses `chrome.storage.sync` for settings, `chrome.storage.local` for undo
- **ES Modules**: Modern JavaScript with import/export
- **Side Panel API**: Chrome 114+ native side panel integration

## 🧪 Testing Checklist

### Basic Setup
- [ ] Load extension in `chrome://extensions`
- [ ] Open 10+ tabs from different domains
- [ ] Extension icon appears in toolbar

### Side Panel
- [ ] Click extension icon → side panel opens
- [ ] Verify groups display with correct colors
- [ ] Verify tab counts are accurate
- [ ] Test "Group by Domain" on ungrouped tabs
- [ ] Test Collapse/Expand on individual groups
- [ ] Test Rename group
- [ ] Test Change color
- [ ] Test "Merge by Domain" action
- [ ] Test "Collapse All" button
- [ ] Test "Expand All" button
- [ ] Test "Refresh" button
- [ ] Verify auto-refresh on panel visibility change

### Popup
- [ ] Right-click icon → popup appears
- [ ] Test "Group by Domain" mode
- [ ] Test "Group by Category" mode
- [ ] Test "Only this window" option
- [ ] Test "Ignore pinned tabs" option
- [ ] Test "Undo" functionality

### Keyboard Shortcuts
- [ ] Test `Ctrl+Shift+G` (Group tabs)
- [ ] Test `Ctrl+Shift+U` (Ungroup all)
- [ ] Test `Ctrl+Shift+C` (Collapse all)

### Edge Cases
- [ ] Test with pinned tabs
- [ ] Test with multiple windows
- [ ] Verify settings persistence (reload extension)

## 🐛 Known Limitations

- Undo supports only one level (last operation)
- Cannot group special Chrome URLs (`chrome://`, `chrome-extension://`)
- Rename/color actions use browser prompts (inline editing coming soon)
- Side panel opens on icon click (popup available via right-click)

## 🔮 Roadmap

- [x] **Side Panel**: Visual group management interface ✅
- [x] **Workspaces Pro**: Multi-window sessions with modes ✅
- [x] **Templates**: Pre-built workspace templates ✅
- [x] **Export/Import**: JSON-based workspace sharing ✅
- [x] **Smart Rules**: Intelligent merging with presets ✅
- [ ] **Custom Rules UI**: Visual rule editor in options page
- [ ] **Auto-save Workspaces**: Schedule automatic workspace backups
- [ ] **Intelligent Rules**: Auto-merge subdomains, whitelist/blacklist
- [ ] **Inline Editing**: Better rename/color UI in side panel
- [ ] **Tab Click**: Activate tabs from side panel
- [ ] **Drag & Drop**: Reorder tabs visually
- [ ] **Batch Processing**: Optimize for 100+ tabs
- [ ] **Auto-collapse**: Schedule automatic group collapsing
- [ ] **i18n**: Multi-language support
- [ ] **Chrome Web Store**: Public distribution

## 📝 License

MIT License - feel free to fork and customize!

## 🤝 Contributing

Built by [Empleaido](https://empleaido.com) - Smart tools for smart work.

Issues and PRs welcome on GitHub.

---

### Credits
**Made with 🧠 by Empleaido** — Smart tools that scale

---

**Version**: 1.6.1
**Manifest**: v3
**Tested on**: Chrome 120+
