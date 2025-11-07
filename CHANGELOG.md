# Changelog

All notable changes to Tab Grouper will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.1] - 2025-10-14

### 📚 Documentation & Store-Ready

- **Branding**: Added professional tagline "Made with 🧠 by Empleaido — Smart tools that scale"
- **Side Panel Footer**: Branded footer with professional documentation statement
- **README**: Added professional header, credits section, and updated to v1.6.1
- **About Page**: Options page (about.html) with documentation links and branding
- **Privacy Policy**: Complete PRIVACY.md for Chrome Web Store submission
- **Store Listing**: Comprehensive STORE_LISTING.md with marketing copy
- **License**: MIT License file added

### 🛠️ Technical

- **Manifest**: Updated version to 1.6.1, added homepage_url and options_page
- **CSS**: Brand footer styles for consistent appearance
- **Quality**: Ready for Chrome Web Store public distribution

---

## [1.6.0] - 2025-10-14

### 🏆 Added - Workspaces Pro

- **Multi-Window Support**: Capture and restore entire browser sessions
  - Saves all open windows with their bounds (position, size, state)
  - Preserves ungrouped tabs per window
  - Window-aware restoration

- **3 Restore Modes**:
  - **Merge in Current**: Add workspace groups/tabs to current window
  - **Recreate in New Windows**: Restore each window in new browser windows
  - **Replace Current**: Clear current window and restore workspace there

- **Tags & Notes System**:
  - Add comma-separated tags to workspaces
  - Free-form notes field for documentation
  - Filter workspaces by tag (API ready)

- **Workspace Operations**:
  - ✏️ **Rename**: Change workspace name in-place
  - 🧬 **Duplicate**: Clone workspace with new name
  - 📊 **Preview**: Expandable preview showing structure, tags, notes, stats
  - 🔄 **Refresh**: Manual list refresh

- **Autosave System (Local Storage)**:
  - Automatic session snapshots saved to chrome.storage.local
  - Configurable max autosaves (1-50, default 10)
  - Manual "Save now" button
  - Separate autosave list with restore
  - Autosaves don't count against sync quota

- **Enhanced Settings**:
  - Include/exclude pinned tabs
  - Include/exclude metadata (titles/favicons)
  - Autosave enabled toggle
  - Max autosaves limit
  - All settings persistent via chrome.storage.sync

### 🔧 Changed

- Workspace schema upgraded to multi-window format
  - `windows[]` array with bounds
  - Ungrouped tabs per window
  - Stats include window count

- Export schema updated:
  - `empleaido.tabgrouper.workspace.pro@1`
  - `empleaido.tabgrouper.workspace.list.pro@1`

- Validation enhanced for multi-window structure
- Improved workspace list display with stats
- Better error messages for all operations

### 🐛 Fixed

- Window bounds preservation (position, size, state)
- Pinned tabs now correctly handled in capture/restore
- Autosave quota management (uses local storage)
- Preview formatting for multi-window workspaces
- Duplicate name handling across autosaves

### 📚 Documentation

- Multi-window workflow documented
- Restore modes explained with use cases
- Autosave system usage guide
- Tags/notes best practices

### 🛠️ Technical

- **New Functions**:
  - `captureWorkspace()` - Multi-window capture
  - `renameWorkspace()` - In-place rename
  - `duplicateWorkspace()` - Clone with new name
  - `restoreWorkspaceSnapshot()` - 3-mode restore
  - `autosaveCurrentSession()` - Session snapshots
  - `listAutosaves()` - Local autosave list

- **Storage Strategy**:
  - Sync: Named workspaces (~100KB quota)
  - Local: Autosaves (unlimited, per-device)

- **Restore Logic**:
  - NEW_WINDOW: Creates windows with saved bounds
  - MERGE_CURRENT: Adds to existing window
  - REPLACE_CURRENT: Clears then restores

---

## [1.5.0] - 2025-10-14

### 🧠 Added

- **Smart Rules Engine**: Intelligent tab grouping with advanced configuration
  - **Subdomain normalization**: Merge `app.notion.so` → `notion.so`
  - **Preset system**: Switch between rule configurations (currently "Empleaido")
  - **Whitelist**: Keep specific hostnames separate (e.g., `drive.google.com`)
  - **Blacklist**: Ignore special URLs (`chrome://`, `about:`, `blob:`, `data:`)
  - **Group size limits**: Auto-split groups exceeding 30 tabs with numbered titles
  - **Auto-collapse option**: Automatically collapse all groups after Smart-Merge

- **Smart-Merge Command**:
  - Keyboard shortcut: `Ctrl/Cmd+Shift+M`
  - Applies intelligent rules-based grouping
  - Respects whitelist, preset, and normalization settings
  - Creates numbered groups for large tab sets

- **MV3 Messaging System**:
  - Panel ↔ Service Worker communication
  - `chrome.runtime.sendMessage` for async operations
  - Error handling with lastError checks
  - Keeps message channels open for async responses

- **Smart Rules UI** in side panel:
  - Toggle subdomain merging on/off
  - Preset selector (currently "Empleaido")
  - Whitelist editor (multi-line prompt)
  - Auto-collapse after merge toggle
  - Visual "Smart-Merge" button with green gradient

- **Configuration Helpers**:
  - `baseHost()`: Extract normalized hostname
  - `isIgnored()`: Check blacklist patterns
  - `matchPreset()`: Apply preset rules
  - `getConfig()` / `setConfig()`: Persistent configuration

### 🔧 Changed

- `COLORS` now exported from rules.js for consistency
- Enhanced CONFIG_DEFAULT with Smart Rules presets
- Service worker handles 4 commands (was 3)
- Rules engine now has 3 matching strategies (whitelist → preset → base host)

### 🐛 Fixed

- Duplicate COLORS declaration removed
- Invalid URL handling in Smart-Merge
- Message channel properly kept open for async responses
- Common second-level domains handled (co.uk, com.br, etc.)

### 📚 Documentation

- Smart Rules usage guide
- Configuration options documented
- Keyboard shortcut added to README
- Preset system explained

### 🛠️ Technical

- **Matching Logic Priority**:
  1. Whitelist (exact hostname match)
  2. Preset rules (regex patterns)
  3. Base host (normalized or full hostname)

- **Group Chunking**:
  - Groups split at 30 tabs (configurable)
  - Numbered titles: "📑 Docs (1)", "📑 Docs (2)"
  - Prevents Chrome performance degradation

- **Storage Extensions**:
  - Smart Rules config in chrome.storage.sync
  - Settings persist across sessions
  - Defaults applied on first use

- **Performance**:
  - Batch group creation with Promise.all for collapse
  - Single-pass tab categorization
  - Efficient Map-based bucketing

---

## [1.4.0] - 2025-10-14

### 🎯 Added

- **Workspaces System**: Save and restore complete tab group configurations
  - Save current window as named workspace
  - Restore workspace (recreates all groups and tabs)
  - List all saved workspaces with statistics (group/tab counts)
  - Delete workspaces with confirmation
  - Persistent storage via `chrome.storage.sync`

- **Export/Import Functionality**:
  - Export selected workspace as JSON file
  - Export all workspaces as JSON file
  - Export current window snapshot (without saving)
  - Import workspaces from JSON with validation
  - Schema versioning: `empleaido.tabgrouper.workspace@1`
  - Automatic name deduplication on import

- **Metadata Toggle**:
  - **Rich mode**: Saves tab titles and favicons (larger files)
  - **Light mode**: Saves only URLs (smaller files, quota-friendly)
  - User-selectable per save/export operation

- **Empleaido Templates**: 5 pre-built workspace templates
  - **Docs**: Notion, Google Docs, Drive
  - **AI**: ChatGPT, Claude, Gemini
  - **Code**: GitHub, Cursor, StackBlitz
  - **Social**: Twitter, Reddit, YouTube
  - **Empleaido**: Combined super-workspace with all categories

- **Visual Improvements**:
  - Workspace section in side panel footer
  - Template selector with one-click loading
  - Export/import controls
  - Status messages with auto-clear (4s)
  - Professional workspace styling

### 🔧 Changed

- Side panel footer expanded with workspace management
- JSON download with timestamp in filename
- Better error messages for workspace operations
- Improved visual hierarchy in side panel

### 🐛 Fixed

- Workspace name validation (trim, non-empty)
- Color validation on import (9 Chrome colors only)
- URL protocol validation (http/https only)
- JSON structure validation before import
- Error handling on failed tab creation
- Duplicate workspace names handled automatically

### 🛡️ Security

- JSON validation prevents malicious imports
- URL protocol whitelist (http/https only)
- Safe HTML rendering for workspace names
- Error boundaries for all async operations

### 📚 Documentation

- Workspace usage guide in README
- JSON schema documentation
- Export/import workflows documented
- Template catalog in README

### 🛠️ Technical

- **New Files**:
  - `workspace.js` - Core workspace management (7.2KB)
  - `templates.js` - Pre-built templates (1.5KB)

- **Storage Usage**:
  - Light mode: ~500 bytes per workspace (10-20 tabs)
  - Rich mode: ~1-2KB per workspace (with metadata)
  - Quota: ~100KB total in chrome.storage.sync

- **Features Count**:
  - 9 workspace operations
  - 5 templates ready to use
  - 3 export modes
  - JSON validation with 6 safety checks

---

## [1.3.0] - 2025-10-14

### 🎨 Added

- **Side Panel**: Visual group management interface with Chrome's native Side Panel API
  - Real-time view of all tab groups in current window
  - Color-coded group indicators with 9 Chrome colors
  - Tab counts and hostname display per group
  - Ungrouped tabs section with quick grouping action

- **Group Management Actions**:
  - Individual collapse/expand per group
  - Rename groups with validation
  - Change group colors (9 options)
  - Merge by domain (global merge across all tabs)
  - Group ungrouped tabs by domain

- **Global Actions** in side panel footer:
  - Collapse All groups
  - Expand All groups
  - Refresh panel data

- **Safety Improvements**:
  - `safeHost()` function for URL extraction with fallback
  - Error handling for all Chrome API calls
  - Throttled render to prevent UI flickering
  - XSS protection for tab titles in HTML rendering
  - Graceful handling of invalid URLs (chrome://, file://, etc.)

- **Testing Infrastructure**:
  - Automated rules test suite (`rules.test.js`)
  - Comprehensive testing guide (`TESTING.md`)
  - Validation script for pre-deployment checks
  - 27 automated tests covering all rule categories

### 🔧 Changed

- Extension icon click now opens side panel (instead of popup)
- Popup still accessible via right-click → "Show popup"
- Improved error messages in console with context
- Better color validation for group color changes
- Trim whitespace in group rename inputs

### 🐛 Fixed

- Invalid URL handling (empty strings, malformed URLs)
- Tab title XSS vulnerability in side panel rendering
- Race conditions in rapid action clicks
- Memory leaks from unthrottled renders
- Chrome internal URLs causing console errors

### 📚 Documentation

- Updated README.md with side panel usage instructions
- Added TESTING.md with complete QA guidelines
- Updated testing checklist with side panel tests
- Documented all safety patches and error handling
- Added roadmap with completed features marked

### 🛠️ Technical

- **New Files**:
  - `sidepanel.html` - Side panel UI structure
  - `sidepanel.js` - Side panel logic (4.8KB)
  - `rules.test.js` - Automated test suite (4.2KB)
  - `TESTING.md` - Testing documentation (8.5KB)

- **Permissions Added**:
  - `sidePanel` - Chrome Side Panel API access

- **Performance**:
  - Throttled rendering with `requestAnimationFrame`
  - Error boundaries to prevent full panel crashes
  - Optimized re-renders on visibility changes

- **Code Quality**:
  - 100% test coverage for rules engine
  - Error handling on all async operations
  - Input validation on all user actions
  - Safe HTML rendering

---

## [1.2.0] - 2025-10-14

### 🎯 Added

- **Manifest V3 Migration**: Full Chrome Extension Manifest V3 support
  - Service worker (`sw.js`) for background operations
  - Clean permissions (removed `host_permissions`)

- **Keyboard Shortcuts**:
  - `Ctrl/Cmd+Shift+G` - Group tabs
  - `Ctrl/Cmd+Shift+U` - Ungroup all tabs
  - `Ctrl/Cmd+Shift+C` - Collapse all groups

- **Rules Engine** (`rules.js`):
  - 6 default categories (Video, Docs, AI, Mail, Code, Social)
  - Extensible custom rules system
  - Persistent storage via `chrome.storage.sync`

- **Enhanced Features**:
  - Window-scoped grouping (group only current window)
  - Ignore pinned tabs option
  - Undo system (1-level) with snapshot storage
  - Settings persistence across sessions

- **Popup Improvements**:
  - Three action buttons (Group, Ungroup, Undo)
  - Visual feedback on button clicks
  - Options checkboxes for window-only and ignore-pinned
  - Keyboard shortcut display

### 🔧 Changed

- Upgraded from Manifest V2 to V3
- Refactored popup.js for async/await patterns
- Modern ES6+ module syntax throughout
- Professional dark theme UI

### 🐛 Fixed

- Duplicate background.js listeners removed
- Incorrect `tabId: null` usage fixed
- Removed unused `groupTabs.js` file
- Cleaned up unnecessary `host_permissions`

### 📚 Documentation

- Comprehensive README.md
- Architecture documentation
- Testing checklist
- Installation guide

---

## [1.1.0] - Initial Release

### Added

- Basic tab grouping by domain
- Category-based grouping with simple heuristics
- Popup UI with mode selector
- Chrome Extension Manifest V2
- Dark theme styling

---

## Release Notes

### v1.3.0 Highlights

**🎨 Visual Side Panel** is the star feature of this release. Users can now:
- See all their tab groups at a glance
- Manage groups visually with one-click actions
- Auto-refresh when switching back to the panel
- Get immediate visual feedback on all operations

**🛡️ Safety & Reliability** improvements ensure:
- No console errors even with invalid URLs
- Graceful degradation when Chrome APIs fail
- Protection against XSS in user content
- Smooth UI without flickering

**🧪 Quality Assurance** with automated testing:
- 100% test pass rate on rules engine
- Comprehensive testing guide for manual QA
- Pre-deployment validation checks
- Edge case coverage (100+ tabs, special URLs)

### Migration Guide

#### From v1.2.0 to v1.3.0

**No breaking changes**. Extension will auto-update with:
- Side panel opens on icon click (new default)
- Popup still available via right-click
- All keyboard shortcuts work identically
- Settings and data preserved

**New Features to Try**:
1. Click extension icon to open side panel
2. Explore group management actions
3. Try "Merge by Domain" for global reorganization
4. Use "Collapse All" / "Expand All" footer buttons

---

## Upcoming Features

### v1.4.0 (Planned)

- **Workspaces**: Save/restore tab group configurations
- **Templates**: Pre-built group templates (Docs/AI/Code/Social)
- **Export/Import**: JSON-based workspace portability
- **Workspace UI**: Visual workspace management in side panel

### Future Roadmap

- Custom rules UI (visual rule editor)
- Inline editing (replace prompts)
- Tab click to activate from side panel
- Drag & drop tab reordering
- Batch processing optimization (100+ tabs)
- Auto-collapse scheduling
- Multi-language support (i18n)

---

## Support

**Issues**: Report bugs via GitHub Issues
**Questions**: Check README.md and TESTING.md
**Contact**: Built by [Empleaido](https://empleaido.com)

**Made with 🧠 by Empleaido** - Smart tools for smart work.
