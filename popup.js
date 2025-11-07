import {
  groupTabs,
  ungroupAll,
  undoLastGroup,
  mergeAllWindows,
  groupsToWindows,
  applyQuickLayout,
  saveWindowLayout,
  loadWindowLayout,
  getWindowLayouts,
  deleteWindowLayout,
  checkDeskDriver,
  applyDeskDriverProfile,
  getDeskDriverProfiles
} from './rules.js';

// Load saved settings
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    ignorePinned: true,
    mode: 'domain'
  });

  document.getElementById('ignorePinned').checked = settings.ignorePinned;
  document.querySelector(`input[name="mode"][value="${settings.mode}"]`).checked = true;
}

// Save settings
async function saveSettings() {
  const settings = {
    ignorePinned: document.getElementById('ignorePinned').checked,
    mode: document.querySelector('input[name="mode"]:checked').value
  };

  await chrome.storage.sync.set(settings);
  return settings;
}

// Wait for DOM to be ready before setting up event listeners
document.addEventListener('DOMContentLoaded', () => {

// Group this window handler
document.getElementById('groupThisWindowBtn').addEventListener('click', async () => {
  const settings = await saveSettings();
  const currentWindow = await chrome.windows.getCurrent();

  const options = {
    windowId: currentWindow.id,
    windowOnly: true,
    ignorePinned: settings.ignorePinned,
    mode: settings.mode
  };

  const groupCount = await groupTabs(options);
  
  // Visual feedback
  const btn = document.getElementById('groupThisWindowBtn');
  btn.textContent = `✓ Grouped ${groupCount} groups`;
  setTimeout(() => {
    btn.textContent = 'Group This Window';
  }, 2000);
});

// Group all windows handler
document.getElementById('groupAllWindowsBtn').addEventListener('click', async () => {
  const settings = await saveSettings();

  const options = {
    windowId: null,
    windowOnly: false,
    ignorePinned: settings.ignorePinned,
    mode: settings.mode
  };

  const groupCount = await groupTabs(options);
  
  // Visual feedback
  const btn = document.getElementById('groupAllWindowsBtn');
  btn.textContent = `✓ Grouped ${groupCount} groups`;
  setTimeout(() => {
    btn.textContent = 'Group All Windows';
  }, 2000);
});

// Ungroup all handler
document.getElementById('ungroupBtn').addEventListener('click', async () => {
  const currentWindow = await chrome.windows.getCurrent();
  const count = await ungroupAll(currentWindow.id);

  const btn = document.getElementById('ungroupBtn');
  btn.textContent = `✓ Ungrouped ${count} tabs`;
  setTimeout(() => {
    btn.textContent = 'Ungroup All';
  }, 2000);
});

// Undo handler
document.getElementById('undoBtn').addEventListener('click', async () => {
  const success = await undoLastGroup();

  const btn = document.getElementById('undoBtn');
  btn.textContent = success ? '✓ Undone' : 'No undo available';
  setTimeout(() => {
    btn.textContent = 'Undo';
  }, 2000);
});

// Merge all windows handler
document.getElementById('mergeWindowsBtn').addEventListener('click', async () => {
  const ignorePinned = document.getElementById('ignorePinned').checked;
  const count = await mergeAllWindows(ignorePinned);

  const btn = document.getElementById('mergeWindowsBtn');
  if (count === 0) {
    btn.textContent = '✓ Only one window';
  } else {
    btn.textContent = `✓ Merged ${count} window${count > 1 ? 's' : ''}`;
  }
  setTimeout(() => {
    btn.textContent = '🔗 Merge All Windows';
  }, 2000);
});

// Groups to windows handler
document.getElementById('groupsToWindowsBtn').addEventListener('click', async () => {
  const count = await groupsToWindows();

  const btn = document.getElementById('groupsToWindowsBtn');
  if (count === 0) {
    btn.textContent = '✓ No groups';
  } else {
    btn.textContent = `✓ Created ${count} window${count > 1 ? 's' : ''}`;
  }
  setTimeout(() => {
    btn.textContent = '🪟 Groups → Windows';
  }, 2000);
});

// ==================== Window Layouts Management ====================

// Initialize layouts UI
async function initLayoutsUI() {
  // Check DeskDriver connection
  const hasDeskDriver = await checkDeskDriver();

  if (hasDeskDriver) {
    document.getElementById('deskdriverStatus').style.display = 'flex';
    document.getElementById('deskdriverProfiles').style.display = 'block';

    // Load DeskDriver profiles
    const profiles = await getDeskDriverProfiles();
    renderDeskDriverProfiles(profiles);
  }

  // Load saved layouts
  await loadSavedLayouts();
}

// Render DeskDriver profiles
function renderDeskDriverProfiles(profiles) {
  const container = document.getElementById('deskdriverProfilesList');

  if (!profiles || Object.keys(profiles).length === 0) {
    container.innerHTML = '<div class="empty-state">No DeskDriver profiles</div>';
    return;
  }

  const profilesHTML = Object.keys(profiles).map(name => {
    const icon = getProfileIcon(name);
    return `
      <button class="deskdriver-profile-btn" data-profile="${name}">
        <span class="profile-icon">${icon}</span>
        <span>${name}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = profilesHTML;

  // Attach event listeners
  container.querySelectorAll('.deskdriver-profile-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const profileName = e.currentTarget.dataset.profile;
      await applyDeskDriverProfileHandler(profileName);
    });
  });
}

// Get profile icon
function getProfileIcon(name) {
  const icons = {
    'work': '💼',
    'creative': '🎨',
    'minimal': '⭕',
    'development': '💻',
    'design': '🎨',
    'presentation': '📊',
    'gaming': '🎮',
    'media': '🎵'
  };

  const lowerName = name.toLowerCase();
  for (const key in icons) {
    if (lowerName.includes(key)) {
      return icons[key];
    }
  }

  return '📱';
}

// Load and render saved layouts
async function loadSavedLayouts() {
  const layouts = await getWindowLayouts();
  const container = document.getElementById('savedLayoutsList');

  if (!layouts || Object.keys(layouts).length === 0) {
    container.innerHTML = '<div class="empty-state">No saved layouts</div>';
    return;
  }

  const layoutsHTML = Object.entries(layouts).map(([name, layout]) => {
    return `
      <div class="saved-layout-item">
        <button class="layout-load-btn" data-layout="${name}">
          <span class="layout-name">📐 ${name}</span>
          <span class="layout-info">${layout.windows.length} windows</span>
        </button>
        <button class="layout-delete-btn" data-layout="${name}" title="Delete">
          ×
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = layoutsHTML;

  // Attach event listeners for load
  container.querySelectorAll('.layout-load-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const layoutName = e.currentTarget.dataset.layout;
      await loadLayoutHandler(layoutName);
    });
  });

  // Attach event listeners for delete
  container.querySelectorAll('.layout-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const layoutName = e.currentTarget.dataset.layout;
      if (confirm(`Delete layout "${layoutName}"?`)) {
        await deleteWindowLayout(layoutName);
        await loadSavedLayouts();
      }
    });
  });
}

// Quick layout buttons
document.querySelectorAll('.layout-btn').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const layoutType = e.currentTarget.dataset.layout;
    const button = e.currentTarget;
    const originalText = button.innerHTML;

    button.innerHTML = '<span class="layout-icon">⏳</span><span>Applying...</span>';
    button.disabled = true;

    try {
      await applyQuickLayout(layoutType);
      button.innerHTML = '<span class="layout-icon">✓</span><span>Done!</span>';
    } catch (error) {
      button.innerHTML = '<span class="layout-icon">✗</span><span>Error</span>';
    }

    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
    }, 1500);
  });
});

// Save layout button
document.getElementById('saveLayoutBtn').addEventListener('click', async () => {
  const layoutName = prompt('Enter layout name:');
  if (!layoutName) return;

  const btn = document.getElementById('saveLayoutBtn');
  const originalText = btn.textContent;

  btn.textContent = '💾 Saving...';
  btn.disabled = true;

  try {
    await saveWindowLayout(layoutName);
    await loadSavedLayouts();
    btn.textContent = '✓ Saved!';
  } catch (error) {
    btn.textContent = '✗ Error';
  }

  setTimeout(() => {
    btn.textContent = originalText;
    btn.disabled = false;
  }, 1500);
});

// Load layout handler
async function loadLayoutHandler(layoutName) {
  const container = document.getElementById('savedLayoutsList');
  const originalHTML = container.innerHTML;

  container.innerHTML = '<div class="empty-state">Loading layout...</div>';

  try {
    await loadWindowLayout(layoutName);
    container.innerHTML = '<div class="empty-state">✓ Layout applied!</div>';
    setTimeout(() => loadSavedLayouts(), 1500);
  } catch (error) {
    container.innerHTML = '<div class="empty-state">✗ Failed to load layout</div>';
    setTimeout(() => {
      container.innerHTML = originalHTML;
    }, 2000);
  }
}

// Apply DeskDriver profile handler
async function applyDeskDriverProfileHandler(profileName) {
  const container = document.getElementById('deskdriverProfilesList');
  const originalHTML = container.innerHTML;

  container.innerHTML = '<div class="empty-state">Applying profile...</div>';

  try {
    await applyDeskDriverProfile(profileName);
    container.innerHTML = '<div class="empty-state">✓ Profile applied!</div>';
    setTimeout(() => {
      container.innerHTML = originalHTML;
    }, 1500);
  } catch (error) {
    container.innerHTML = '<div class="empty-state">✗ Failed to apply</div>';
    setTimeout(() => {
      container.innerHTML = originalHTML;
    }, 2000);
  }
}

// Initialize on popup load
initLayoutsUI();

// Load settings on popup open
loadSettings();

}); // End of DOMContentLoaded
