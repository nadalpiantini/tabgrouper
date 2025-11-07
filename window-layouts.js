// Window Layouts System for Tab Grouper
// Manages window positioning and integration with DeskDriver

// Position presets for Chrome windows
export const POSITION_PRESETS = {
  fullscreen: {
    state: 'maximized',
    description: 'Full screen'
  },
  left_half: {
    left: 0,
    top: 0,
    width: 0.5,
    height: 1.0,
    description: 'Left half'
  },
  right_half: {
    left: 0.5,
    top: 0,
    width: 0.5,
    height: 1.0,
    description: 'Right half'
  },
  top_half: {
    left: 0,
    top: 0,
    width: 1.0,
    height: 0.5,
    description: 'Top half'
  },
  bottom_half: {
    left: 0,
    top: 0.5,
    width: 1.0,
    height: 0.5,
    description: 'Bottom half'
  },
  center: {
    left: 0.15,
    top: 0.1,
    width: 0.7,
    height: 0.8,
    description: 'Center (70%)'
  },
  top_left: {
    left: 0,
    top: 0,
    width: 0.5,
    height: 0.5,
    description: 'Top left quarter'
  },
  top_right: {
    left: 0.5,
    top: 0,
    width: 0.5,
    height: 0.5,
    description: 'Top right quarter'
  },
  bottom_left: {
    left: 0,
    top: 0.5,
    width: 0.5,
    height: 0.5,
    description: 'Bottom left quarter'
  },
  bottom_right: {
    left: 0.5,
    top: 0.5,
    width: 0.5,
    height: 0.5,
    description: 'Bottom right quarter'
  },
  thirds_left: {
    left: 0,
    top: 0,
    width: 0.333,
    height: 1.0,
    description: 'Left third'
  },
  thirds_center: {
    left: 0.333,
    top: 0,
    width: 0.334,
    height: 1.0,
    description: 'Center third'
  },
  thirds_right: {
    left: 0.667,
    top: 0,
    width: 0.333,
    height: 1.0,
    description: 'Right third'
  }
};

// DeskDriver API Bridge
export class DeskDriverBridge {
  constructor() {
    this.baseURL = 'http://localhost:8546/api';
    this.isConnected = false;
    this.profiles = {};
  }

  async checkConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`${this.baseURL}/health`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isConnected = response.ok;
      return this.isConnected;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async getProfiles() {
    if (!this.isConnected) return {};

    try {
      const response = await fetch(`${this.baseURL}/profiles`);
      if (response.ok) {
        const data = await response.json();
        this.profiles = data.data || {};
        return this.profiles;
      }
    } catch (error) {
      console.error('Failed to load DeskDriver profiles:', error);
    }

    return {};
  }

  async applyProfile(profileName) {
    if (!this.isConnected) return false;

    try {
      const response = await fetch(`${this.baseURL}/profiles/${profileName}/apply`, {
        method: 'POST'
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to apply DeskDriver profile:', error);
      return false;
    }
  }

  async captureLayout() {
    if (!this.isConnected) return null;

    try {
      const response = await fetch(`${this.baseURL}/windows/capture`);
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error('Failed to capture DeskDriver layout:', error);
    }

    return null;
  }

  async reloadConfig() {
    if (!this.isConnected) return false;

    try {
      const response = await fetch(`${this.baseURL}/config/reload`, {
        method: 'POST'
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to reload DeskDriver config:', error);
      return false;
    }
  }
}

// Window Layout Manager
export class WindowLayoutManager {
  constructor() {
    this.deskDriver = new DeskDriverBridge();
    this.hasDeskDriver = false;
  }

  async init() {
    this.hasDeskDriver = await this.deskDriver.checkConnection();
    return this.hasDeskDriver;
  }

  async applyWindowPosition(windowId, preset) {
    const position = POSITION_PRESETS[preset];
    if (!position) {
      console.error('Invalid position preset:', preset);
      return false;
    }

    try {
      // Get screen dimensions
      const window = await chrome.windows.get(windowId);
      const displays = await chrome.system.display.getInfo();
      const primaryDisplay = displays.find(d => d.isPrimary) || displays[0];

      const screenWidth = primaryDisplay.workArea.width;
      const screenHeight = primaryDisplay.workArea.height;
      const screenLeft = primaryDisplay.workArea.left;
      const screenTop = primaryDisplay.workArea.top;

      // Handle fullscreen/maximized
      if (position.state === 'maximized') {
        await chrome.windows.update(windowId, { state: 'maximized' });
        return true;
      }

      // Calculate position
      const updateInfo = {
        state: 'normal',
        left: Math.round(screenLeft + (position.left * screenWidth)),
        top: Math.round(screenTop + (position.top * screenHeight)),
        width: Math.round(position.width * screenWidth),
        height: Math.round(position.height * screenHeight)
      };

      await chrome.windows.update(windowId, updateInfo);
      return true;
    } catch (error) {
      console.error('Failed to apply window position:', error);
      return false;
    }
  }

  async saveLayout(layoutName, includeTabGroups = true) {
    const windows = await chrome.windows.getAll({ populate: true });
    const layout = {
      name: layoutName,
      timestamp: Date.now(),
      windows: []
    };

    for (const window of windows) {
      const windowInfo = {
        windowId: window.id,
        state: window.state,
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
        focused: window.focused
      };

      if (includeTabGroups) {
        const tabGroups = await chrome.tabGroups.query({ windowId: window.id });
        windowInfo.tabGroups = tabGroups.map(group => ({
          id: group.id,
          title: group.title,
          color: group.color,
          collapsed: group.collapsed,
          tabs: window.tabs
            .filter(tab => tab.groupId === group.id)
            .map(tab => ({
              url: tab.url,
              title: tab.title,
              pinned: tab.pinned
            }))
        }));

        // Ungrouped tabs
        windowInfo.ungroupedTabs = window.tabs
          .filter(tab => tab.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE)
          .map(tab => ({
            url: tab.url,
            title: tab.title,
            pinned: tab.pinned
          }));
      }

      layout.windows.push(windowInfo);
    }

    // Save to storage
    const { layouts = {} } = await chrome.storage.sync.get('layouts');
    layouts[layoutName] = layout;
    await chrome.storage.sync.set({ layouts });

    return layout;
  }

  async loadLayout(layoutName) {
    const { layouts = {} } = await chrome.storage.sync.get('layouts');
    const layout = layouts[layoutName];

    if (!layout) {
      console.error('Layout not found:', layoutName);
      return false;
    }

    // Close all windows except the first one
    const currentWindows = await chrome.windows.getAll();
    for (let i = 1; i < currentWindows.length; i++) {
      await chrome.windows.remove(currentWindows[i].id);
    }

    // Create windows from layout
    for (let i = 0; i < layout.windows.length; i++) {
      const windowLayout = layout.windows[i];

      // Create or use first window
      let windowId;
      if (i === 0) {
        windowId = currentWindows[0].id;

        // Close all tabs in first window
        const tabs = await chrome.tabs.query({ windowId });
        const tabIds = tabs.slice(1).map(t => t.id); // Keep first tab
        if (tabIds.length > 0) {
          await chrome.tabs.remove(tabIds);
        }
      } else {
        const newWindow = await chrome.windows.create({
          focused: windowLayout.focused,
          state: 'normal'
        });
        windowId = newWindow.id;
      }

      // Restore tabs and groups
      if (windowLayout.tabGroups) {
        for (const group of windowLayout.tabGroups) {
          const createdTabs = [];

          for (const tabInfo of group.tabs) {
            const tab = await chrome.tabs.create({
              windowId,
              url: tabInfo.url,
              pinned: tabInfo.pinned,
              active: false
            });
            createdTabs.push(tab.id);
          }

          if (createdTabs.length > 0) {
            const groupId = await chrome.tabs.group({ tabIds: createdTabs });
            await chrome.tabGroups.update(groupId, {
              title: group.title,
              color: group.color,
              collapsed: group.collapsed
            });
          }
        }
      }

      // Restore ungrouped tabs
      if (windowLayout.ungroupedTabs) {
        for (const tabInfo of windowLayout.ungroupedTabs) {
          await chrome.tabs.create({
            windowId,
            url: tabInfo.url,
            pinned: tabInfo.pinned,
            active: false
          });
        }
      }

      // Apply window position
      await chrome.windows.update(windowId, {
        state: windowLayout.state,
        left: windowLayout.left,
        top: windowLayout.top,
        width: windowLayout.width,
        height: windowLayout.height
      });
    }

    return true;
  }

  async getLayouts() {
    const { layouts = {} } = await chrome.storage.sync.get('layouts');
    return layouts;
  }

  async deleteLayout(layoutName) {
    const { layouts = {} } = await chrome.storage.sync.get('layouts');
    delete layouts[layoutName];
    await chrome.storage.sync.set({ layouts });
    return true;
  }

  // Quick preset layouts
  async applyQuickLayout(layoutType) {
    const windows = await chrome.windows.getAll();

    switch (layoutType) {
      case 'dual_vertical':
        // Two windows side by side
        if (windows.length >= 2) {
          await this.applyWindowPosition(windows[0].id, 'left_half');
          await this.applyWindowPosition(windows[1].id, 'right_half');
        }
        break;

      case 'dual_horizontal':
        // Two windows stacked
        if (windows.length >= 2) {
          await this.applyWindowPosition(windows[0].id, 'top_half');
          await this.applyWindowPosition(windows[1].id, 'bottom_half');
        }
        break;

      case 'triple_columns':
        // Three windows in columns
        if (windows.length >= 3) {
          await this.applyWindowPosition(windows[0].id, 'thirds_left');
          await this.applyWindowPosition(windows[1].id, 'thirds_center');
          await this.applyWindowPosition(windows[2].id, 'thirds_right');
        }
        break;

      case 'quad':
        // Four windows in quarters
        if (windows.length >= 4) {
          await this.applyWindowPosition(windows[0].id, 'top_left');
          await this.applyWindowPosition(windows[1].id, 'top_right');
          await this.applyWindowPosition(windows[2].id, 'bottom_left');
          await this.applyWindowPosition(windows[3].id, 'bottom_right');
        }
        break;

      case 'focus':
        // One centered window
        if (windows.length >= 1) {
          await this.applyWindowPosition(windows[0].id, 'center');
        }
        break;

      default:
        console.error('Unknown quick layout type:', layoutType);
        return false;
    }

    return true;
  }
}
