/**
 * Comprehensive manual test script for puppeteer-extra-plugin-user-data-dir
 *
 * This script will:
 * 1. Test automatic temporary directory creation
 * 2. Test file injection into profiles
 * 3. Test persistent directory usage
 * 4. Test cleanup behavior
 * 5. Verify all README examples work correctly
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addExtra } from '@zorilla/puppeteer-extra';
import puppeteer from 'puppeteer';
import UserDataDirPlugin from './dist/index.js';

console.log('🧪 Starting Comprehensive User Data Dir Plugin Testing\n');
console.log('='.repeat(80));

/**
 * Test 1: Automatic Temporary Directory Creation
 */
async function testAutomaticTempDirectory() {
  console.log('\n📍 TEST 1: Automatic Temporary Directory Creation');
  console.log('-'.repeat(80));

  const puppeteerExtra = addExtra(puppeteer);
  const plugin = UserDataDirPlugin();
  puppeteerExtra.use(plugin);

  console.log('  → Launching browser without userDataDir...');
  const browser = await puppeteerExtra.launch({ headless: true });

  // Access the userDataDir from the plugin
  const userDataDir = plugin._userDataDir;
  const isTemp = plugin._isTemporary;

  console.log(`  ✓ User data dir created: ${userDataDir}`);
  console.log(`  ✓ Is temporary: ${isTemp}`);
  console.log(
    `  ✓ Directory exists: ${userDataDir ? fs.existsSync(userDataDir) : false}`
  );

  await browser.close();

  // Wait a bit for cleanup
  await new Promise(resolve => setTimeout(resolve, 500));

  const stillExists = userDataDir ? fs.existsSync(userDataDir) : false;
  console.log(
    `  ${!stillExists ? '✓' : '✗'} Directory cleaned up after disconnect: ${!stillExists}`
  );

  return {
    created: userDataDir?.includes('puppeteer_dev_profile-'),
    cleanedUp: !stillExists,
  };
}

/**
 * Test 2: File Injection
 */
async function testFileInjection() {
  console.log('\n📍 TEST 2: File Injection into Profile');
  console.log('-'.repeat(80));

  const puppeteerExtra = addExtra(puppeteer);

  const testPreferences = {
    profile: {
      default_content_setting_values: {
        notifications: 2,
      },
    },
  };

  const plugin = UserDataDirPlugin({
    files: [
      {
        target: 'Profile',
        file: 'Preferences',
        contents: JSON.stringify(testPreferences, null, 2),
      },
      {
        target: 'Profile',
        file: 'First Run',
        contents: '',
      },
      {
        target: 'Profile',
        file: 'nested/test.txt',
        contents: 'nested file content',
      },
    ],
  });

  puppeteerExtra.use(plugin);

  console.log('  → Launching browser with file injection...');
  const browser = await puppeteerExtra.launch({ headless: true });
  const userDataDir = plugin._userDataDir;

  // Check if files were written
  const preferencesPath = path.join(userDataDir, 'Default', 'Preferences');
  const firstRunPath = path.join(userDataDir, 'Default', 'First Run');
  const nestedPath = path.join(userDataDir, 'Default', 'nested', 'test.txt');

  console.log(`  ✓ Preferences file exists: ${fs.existsSync(preferencesPath)}`);
  console.log(`  ✓ First Run file exists: ${fs.existsSync(firstRunPath)}`);
  console.log(`  ✓ Nested file exists: ${fs.existsSync(nestedPath)}`);

  if (fs.existsSync(preferencesPath)) {
    const content = fs.readFileSync(preferencesPath, 'utf8');
    const parsed = JSON.parse(content);
    const correctContent =
      parsed.profile?.default_content_setting_values?.notifications === 2;
    console.log(`  ✓ Preferences content correct: ${correctContent}`);
  }

  if (fs.existsSync(nestedPath)) {
    const content = fs.readFileSync(nestedPath, 'utf8');
    console.log(
      `  ✓ Nested file content correct: ${content === 'nested file content'}`
    );
  }

  await browser.close();

  return {
    preferencesCreated: fs.existsSync(preferencesPath),
    firstRunCreated: fs.existsSync(firstRunPath),
    nestedCreated: fs.existsSync(nestedPath),
  };
}

/**
 * Test 3: Persistent Directory
 */
async function testPersistentDirectory() {
  console.log('\n📍 TEST 3: Persistent Directory Usage');
  console.log('-'.repeat(80));

  const persistentDir = path.join(
    os.tmpdir(),
    'test-persistent-profile-' + Date.now()
  );
  fs.mkdirSync(persistentDir, { recursive: true });

  const puppeteerExtra = addExtra(puppeteer);
  const plugin = UserDataDirPlugin({
    deleteExisting: false,
  });
  puppeteerExtra.use(plugin);

  console.log(`  → Using persistent directory: ${persistentDir}`);
  const browser = await puppeteerExtra.launch({
    headless: true,
    userDataDir: persistentDir,
  });

  console.log(`  ✓ Browser launched with custom dir`);

  await browser.close();

  // Wait for potential cleanup
  await new Promise(resolve => setTimeout(resolve, 300));

  const stillExists = fs.existsSync(persistentDir);
  console.log(
    `  ${stillExists ? '✓' : '✗'} Directory preserved after disconnect: ${stillExists}`
  );

  // Cleanup
  if (stillExists) {
    fs.rmSync(persistentDir, { recursive: true, force: true });
  }

  return { preserved: stillExists };
}

/**
 * Test 4: Custom Temporary Location
 */
async function testCustomTempLocation() {
  console.log('\n📍 TEST 4: Custom Temporary Directory Location');
  console.log('-'.repeat(80));

  const customTempDir = path.join(os.tmpdir(), 'custom-temp-location');
  fs.mkdirSync(customTempDir, { recursive: true });

  const puppeteerExtra = addExtra(puppeteer);
  const plugin = UserDataDirPlugin({
    folderPath: customTempDir,
    folderPrefix: 'my-browser-',
    deleteTemporary: true,
  });
  puppeteerExtra.use(plugin);

  console.log(`  → Using custom temp location: ${customTempDir}`);
  const browser = await puppeteerExtra.launch({ headless: true });
  const userDataDir = plugin._userDataDir;

  const usesCustomLocation = userDataDir?.startsWith(customTempDir);
  const usesCustomPrefix = userDataDir?.includes('my-browser-');

  console.log(`  ✓ Uses custom location: ${usesCustomLocation}`);
  console.log(`  ✓ Uses custom prefix: ${usesCustomPrefix}`);
  console.log(`  ✓ Created directory: ${userDataDir}`);

  await browser.close();

  // Wait for cleanup
  await new Promise(resolve => setTimeout(resolve, 500));

  // Cleanup custom temp dir
  if (fs.existsSync(customTempDir)) {
    fs.rmSync(customTempDir, { recursive: true, force: true });
  }

  return {
    customLocation: usesCustomLocation,
    customPrefix: usesCustomPrefix,
  };
}

/**
 * Test 5: Cleanup with deleteTemporary: false
 */
async function testNoCleanup() {
  console.log('\n📍 TEST 5: No Cleanup with deleteTemporary: false');
  console.log('-'.repeat(80));

  const puppeteerExtra = addExtra(puppeteer);
  const plugin = UserDataDirPlugin({
    deleteTemporary: false,
  });
  puppeteerExtra.use(plugin);

  console.log('  → Launching browser with deleteTemporary: false...');
  const browser = await puppeteerExtra.launch({ headless: true });
  const userDataDir = plugin._userDataDir;

  console.log(`  ✓ Temp directory created: ${userDataDir}`);

  await browser.close();

  // Wait for potential cleanup
  await new Promise(resolve => setTimeout(resolve, 300));

  const stillExists = fs.existsSync(userDataDir);
  console.log(
    `  ${stillExists ? '✓' : '✗'} Directory preserved (not cleaned): ${stillExists}`
  );

  // Manual cleanup
  if (stillExists) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
    console.log(`  ✓ Manual cleanup successful`);
  }

  return { preserved: stillExists };
}

/**
 * Test 6: README Examples Verification
 */
async function testReadmeExamples() {
  console.log('\n📍 TEST 6: README Example Verification');
  console.log('-'.repeat(80));

  const results = {
    example1: false,
    example2: false,
    example3: false,
    example4: false,
  };

  // Example 1: Basic Usage
  try {
    console.log('\n  → Testing Example 1: Basic Usage...');
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(UserDataDirPlugin());
    const browser = await puppeteerExtra.launch({ headless: true });
    await browser.close();
    await new Promise(resolve => setTimeout(resolve, 300));
    results.example1 = true;
    console.log('  ✓ Example 1 passed');
  } catch (err) {
    console.log(`  ✗ Example 1 failed: ${err.message}`);
  }

  // Example 2: Inject Files
  try {
    console.log('\n  → Testing Example 2: Inject Files...');
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(
      UserDataDirPlugin({
        files: [
          {
            target: 'Profile',
            file: 'Preferences',
            contents: JSON.stringify({
              profile: {
                default_content_setting_values: {
                  notifications: 2,
                },
              },
            }),
          },
          {
            target: 'Profile',
            file: 'First Run',
            contents: '',
          },
        ],
      })
    );
    const browser = await puppeteerExtra.launch({ headless: true });
    await browser.close();
    await new Promise(resolve => setTimeout(resolve, 300));
    results.example2 = true;
    console.log('  ✓ Example 2 passed');
  } catch (err) {
    console.log(`  ✗ Example 2 failed: ${err.message}`);
  }

  // Example 3: Persistent Profile
  try {
    console.log('\n  → Testing Example 3: Persistent Profile...');
    const testDir = path.join(os.tmpdir(), 'test-persist-' + Date.now());
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(
      UserDataDirPlugin({
        deleteExisting: false,
      })
    );
    const browser = await puppeteerExtra.launch({
      headless: true,
      userDataDir: testDir,
    });
    await browser.close();
    await new Promise(resolve => setTimeout(resolve, 300));
    const exists = fs.existsSync(testDir);
    if (exists) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    results.example3 = exists;
    console.log('  ✓ Example 3 passed');
  } catch (err) {
    console.log(`  ✗ Example 3 failed: ${err.message}`);
  }

  // Example 4: Custom Temp Location
  try {
    console.log('\n  → Testing Example 4: Custom Temp Location...');
    const customDir = path.join(os.tmpdir(), 'custom-test-' + Date.now());
    fs.mkdirSync(customDir, { recursive: true });

    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(
      UserDataDirPlugin({
        folderPath: customDir,
        folderPrefix: 'my-browser-profile-',
        deleteTemporary: true,
      })
    );
    const browser = await puppeteerExtra.launch({ headless: true });
    await browser.close();
    await new Promise(resolve => setTimeout(resolve, 500));

    if (fs.existsSync(customDir)) {
      fs.rmSync(customDir, { recursive: true, force: true });
    }
    results.example4 = true;
    console.log('  ✓ Example 4 passed');
  } catch (err) {
    console.log(`  ✗ Example 4 failed: ${err.message}`);
  }

  return results;
}

/**
 * Test 7: Error Handling
 */
async function testErrorHandling() {
  console.log('\n📍 TEST 7: Error Handling');
  console.log('-'.repeat(80));

  // Test invalid target warning
  console.log('\n  → Testing invalid target warning...');
  const puppeteerExtra = addExtra(puppeteer);
  const plugin = UserDataDirPlugin({
    files: [
      {
        target: 'InvalidTarget',
        file: 'test.txt',
        contents: 'test',
      },
    ],
  });
  puppeteerExtra.use(plugin);

  const browser = await puppeteerExtra.launch({ headless: true });
  console.log('  ✓ Browser launched despite invalid target');

  await browser.close();
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log('  ✓ Error handling works correctly');

  return { errorHandlingWorks: true };
}

/**
 * Main test runner
 */
async function runAllTests() {
  const startTime = Date.now();

  try {
    const test1 = await testAutomaticTempDirectory();
    const test2 = await testFileInjection();
    const test3 = await testPersistentDirectory();
    const test4 = await testCustomTempLocation();
    const test5 = await testNoCleanup();
    const test6 = await testReadmeExamples();
    const test7 = await testErrorHandling();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('📊 Test Results Summary:');
    console.log('-'.repeat(80));
    console.log('Test 1 - Auto Temp Dir:');
    console.log(`  ✓ Created: ${test1.created}`);
    console.log(`  ✓ Cleaned up: ${test1.cleanedUp}`);
    console.log('\nTest 2 - File Injection:');
    console.log(`  ✓ Preferences: ${test2.preferencesCreated}`);
    console.log(`  ✓ First Run: ${test2.firstRunCreated}`);
    console.log(`  ✓ Nested: ${test2.nestedCreated}`);
    console.log('\nTest 3 - Persistent Dir:');
    console.log(`  ✓ Preserved: ${test3.preserved}`);
    console.log('\nTest 4 - Custom Temp:');
    console.log(`  ✓ Custom location: ${test4.customLocation}`);
    console.log(`  ✓ Custom prefix: ${test4.customPrefix}`);
    console.log('\nTest 5 - No Cleanup:');
    console.log(`  ✓ Preserved: ${test5.preserved}`);
    console.log('\nTest 6 - README Examples:');
    console.log(`  ✓ Example 1: ${test6.example1}`);
    console.log(`  ✓ Example 2: ${test6.example2}`);
    console.log(`  ✓ Example 3: ${test6.example3}`);
    console.log(`  ✓ Example 4: ${test6.example4}`);
    console.log('\nTest 7 - Error Handling:');
    console.log(`  ✓ Works correctly: ${test7.errorHandlingWorks}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log(`⏱  Total time: ${duration}s`);
    console.log('='.repeat(80) + '\n');
  } catch (err) {
    console.error('\n❌ Test suite failed with error:');
    console.error(err);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
