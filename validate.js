// Validation script for Tab Grouper extension
// Run with: node validate.js

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED_FILES = [
  'manifest.json',
  'sw.js',
  'rules.js',
  'workspace.js',
  'templates.js',
  'popup.html',
  'popup.js',
  'sidepanel.html',
  'sidepanel.js',
  'style.css',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png'
];

const REQUIRED_PERMISSIONS = ['tabs', 'tabGroups', 'storage'];
const REQUIRED_COMMANDS = ['group-tabs', 'ungroup-tabs', 'collapse-groups'];

console.log('🔍 Validating Tab Grouper extension...\n');

let errors = 0;
let warnings = 0;

// Check required files
console.log('📁 Checking required files...');
for (const file of REQUIRED_FILES) {
  const path = join(__dirname, file);
  if (existsSync(path)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors++;
  }
}

// Validate manifest.json
console.log('\n📋 Validating manifest.json...');
try {
  const manifestPath = join(__dirname, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  // Check manifest version
  if (manifest.manifest_version === 3) {
    console.log('  ✅ Manifest version 3');
  } else {
    console.log('  ❌ Manifest version should be 3');
    errors++;
  }

  // Check permissions
  const missingPerms = REQUIRED_PERMISSIONS.filter(p => !manifest.permissions?.includes(p));
  if (missingPerms.length === 0) {
    console.log('  ✅ All required permissions present');
  } else {
    console.log(`  ❌ Missing permissions: ${missingPerms.join(', ')}`);
    errors++;
  }

  // Check host_permissions should NOT be present
  if (!manifest.host_permissions) {
    console.log('  ✅ No host_permissions (clean!)');
  } else {
    console.log('  ⚠️  host_permissions present but not needed');
    warnings++;
  }

  // Check service worker
  if (manifest.background?.service_worker === 'sw.js') {
    console.log('  ✅ Service worker configured');
  } else {
    console.log('  ❌ Service worker not configured correctly');
    errors++;
  }

  // Check commands
  const missingCommands = REQUIRED_COMMANDS.filter(c => !manifest.commands?.[c]);
  if (missingCommands.length === 0) {
    console.log('  ✅ All keyboard shortcuts configured');
  } else {
    console.log(`  ❌ Missing commands: ${missingCommands.join(', ')}`);
    errors++;
  }

  // Check icons
  if (manifest.icons && manifest.icons['16'] && manifest.icons['48'] && manifest.icons['128']) {
    console.log('  ✅ All icon sizes defined');
  } else {
    console.log('  ❌ Missing icon definitions');
    errors++;
  }

} catch (e) {
  console.log(`  ❌ Error reading manifest.json: ${e.message}`);
  errors++;
}

// Check for ES modules in HTML
console.log('\n📦 Checking ES module usage...');
try {
  const popupHtml = readFileSync(join(__dirname, 'popup.html'), 'utf8');
  if (popupHtml.includes('type="module"')) {
    console.log('  ✅ ES modules configured in popup.html');
  } else {
    console.log('  ⚠️  popup.html should use type="module" for imports');
    warnings++;
  }
} catch (e) {
  console.log(`  ❌ Error checking popup.html: ${e.message}`);
  errors++;
}

// Check for import/export in JavaScript files
console.log('\n🔧 Checking JavaScript modules...');
try {
  const rulesJs = readFileSync(join(__dirname, 'rules.js'), 'utf8');
  if (rulesJs.includes('export ')) {
    console.log('  ✅ rules.js uses ES module exports');
  } else {
    console.log('  ❌ rules.js should use ES module exports');
    errors++;
  }

  const popupJs = readFileSync(join(__dirname, 'popup.js'), 'utf8');
  if (popupJs.includes('import ')) {
    console.log('  ✅ popup.js uses ES module imports');
  } else {
    console.log('  ❌ popup.js should use ES module imports');
    errors++;
  }

  const swJs = readFileSync(join(__dirname, 'sw.js'), 'utf8');
  if (swJs.includes('import ')) {
    console.log('  ✅ sw.js uses ES module imports');
  } else {
    console.log('  ❌ sw.js should use ES module imports');
    errors++;
  }
} catch (e) {
  console.log(`  ❌ Error checking JavaScript files: ${e.message}`);
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Validation Summary');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Extension is ready to load.');
  console.log('\n📖 Next steps:');
  console.log('   1. Open chrome://extensions in Chrome');
  console.log('   2. Enable "Developer mode"');
  console.log('   3. Click "Load unpacked"');
  console.log('   4. Select this directory');
  process.exit(0);
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(s) found`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} warning(s) found`);
  }
  console.log('\n🔧 Fix errors before loading extension.');
  process.exit(errors > 0 ? 1 : 0);
}
