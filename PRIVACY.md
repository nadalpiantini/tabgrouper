# Privacy Policy — Tab Grouper (Empleaido)

**Last Updated**: October 14, 2025

## Summary

**Tab Grouper does not collect, transmit, or sell any personal data.**

This extension processes all information locally in your browser and does not communicate with external servers.

---

## What Data Is Processed

Tab Grouper accesses the following information **only locally** to provide its functionality:

### Tab Information
- **Tab URLs**: To categorize and group tabs by domain or category
- **Tab Titles**: To display in workspace previews (optional)
- **Tab Favicons**: To enhance workspace visualization (optional)
- **Tab Groups**: To manage and organize your tab groups

### Storage
- **Local Preferences**: Your settings, workspaces, and autosaves are stored using:
  - `chrome.storage.sync`: Synced across your Chrome browsers (if signed in)
  - `chrome.storage.local`: Local autosaves (device-specific)

### Window Information
- **Window Bounds**: Position, size, and state (for multi-window workspace restoration)

---

## What We Do NOT Do

❌ **No External Communication**: We do not send any data to external servers
❌ **No Analytics**: We do not track your usage or behavior
❌ **No Third-Party Services**: We do not integrate with external services
❌ **No Content Access**: We do not read or access the content of web pages
❌ **No Form Data**: We do not access form inputs or credentials
❌ **No Cookies**: We do not set or read cookies
❌ **No Advertising**: We do not show ads or track for advertising purposes

---

## Permissions Explained

Tab Grouper requests only the minimum permissions necessary:

### `tabs`
- **Purpose**: Read tab URLs and titles for grouping
- **Scope**: Metadata only (URL, title)
- **No access to**: Page content, form data, passwords

### `tabGroups`
- **Purpose**: Create, modify, and manage tab groups
- **Scope**: Chrome's native tab group feature
- **No access to**: Tab content

### `storage`
- **Purpose**: Save your preferences, workspaces, and autosaves
- **Scope**: Extension storage only
- **No access to**: Other extensions' storage or website data

### `sidePanel`
- **Purpose**: Display the visual side panel interface
- **Scope**: Extension UI only
- **No access to**: Website content

---

## Data Storage

### Synchronized Data (chrome.storage.sync)
- Workspaces
- Smart Rules configuration
- Extension settings
- **Quota**: ~100KB total
- **Synced**: Across your Chrome browsers (if signed in to Chrome)

### Local Data (chrome.storage.local)
- Autosave sessions
- **Quota**: Unlimited
- **Stored**: On your device only (not synced)

### User Control
- You can delete all data by removing the extension
- Workspaces can be individually deleted via the UI
- Autosaves can be cleared by adjusting the max limit to 0

---

## Security

- All data processing happens locally in your browser
- No network requests are made by this extension
- Workspace export/import uses client-side JSON validation
- Only `http://` and `https://` URLs are accepted for security

---

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

---

## Contact

If you have questions about this privacy policy or Tab Grouper's data practices:

- **Email**: support@empleaido.com
- **Website**: [empleaido.com](https://empleaido.com)
- **GitHub**: [github.com/empleaido/tab-grouper](https://github.com/empleaido/tab-grouper)

---

**Made with 🧠 by Empleaido** — Smart tools that scale
