/**
 * Local test script - no network requests
 * Tests core evasion functionality locally
 */

import puppeteer from 'puppeteer';

console.log('🧪 Local Stealth Plugin Testing\n');
console.log('='.repeat(80));

/**
 * Test comprehensive detection checks
 */
async function testDetectionChecks() {
  console.log('\n📍 Comprehensive Detection Tests');
  console.log('-'.repeat(80));

  // Test 1: Vanilla Puppeteer
  console.log('\n  1️⃣  VANILLA PUPPETEER (No Evasions)');
  console.log('  ' + '-'.repeat(76));

  const vanillaBrowser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const vanillaPage = await vanillaBrowser.newPage();
  await vanillaPage.goto('about:blank');

  const vanillaResults = await vanillaPage.evaluate(() => {
    // Comprehensive detection checks
    const results = {};

    // 1. navigator.webdriver
    results.webdriverPresent = 'webdriver' in navigator;
    results.webdriverValue = navigator.webdriver;

    // 2. User Agent
    results.userAgent = navigator.userAgent;
    results.hasHeadlessChrome = navigator.userAgent.includes('HeadlessChrome');

    // 3. Plugins
    results.pluginsLength = navigator.plugins.length;
    results.pluginsArray = Array.from(navigator.plugins).map(p => p.name);

    // 4. Languages
    results.languages = navigator.languages;
    results.languagesEmpty = navigator.languages.length === 0;

    // 5. window.chrome
    results.hasChromeObject = typeof window.chrome !== 'undefined';
    results.hasChromeRuntime = typeof window.chrome?.runtime !== 'undefined';

    // 6. Permissions API
    results.hasPermissionsAPI = typeof navigator.permissions !== 'undefined';

    // 7. WebGL vendor
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          results.webglVendor = gl.getParameter(
            debugInfo.UNMASKED_VENDOR_WEBGL
          );
          results.webglRenderer = gl.getParameter(
            debugInfo.UNMASKED_RENDERER_WEBGL
          );
        }
      }
    } catch (err) {
      results.webglError = err.message;
    }

    // 8. Window dimensions
    results.outerWidth = window.outerWidth;
    results.outerHeight = window.outerHeight;
    results.innerWidth = window.innerWidth;
    results.innerHeight = window.innerHeight;

    // 9. navigator.platform
    results.platform = navigator.platform;

    // 10. navigator.vendor
    results.vendor = navigator.vendor;

    // 11. Hardware concurrency
    results.hardwareConcurrency = navigator.hardwareConcurrency;

    // 12. Chrome detection tests
    results.chromeKeys = window.chrome ? Object.keys(window.chrome) : [];

    // 13. Automation flags in Chrome
    results.automationControlled = navigator.webdriver === true;

    return results;
  });

  console.log('  Results:');
  console.log(
    `    ⚠️  navigator.webdriver: ${vanillaResults.webdriverValue} (${vanillaResults.webdriverPresent ? 'PRESENT' : 'ABSENT'})`
  );
  console.log(
    `    ⚠️  User agent has HeadlessChrome: ${vanillaResults.hasHeadlessChrome}`
  );
  console.log(`    ✓  Plugins: ${vanillaResults.pluginsLength}`);
  console.log(`    ✓  Languages: ${JSON.stringify(vanillaResults.languages)}`);
  console.log(`    ✓  window.chrome: ${vanillaResults.hasChromeObject}`);
  console.log(`    ✓  chrome.runtime: ${vanillaResults.hasChromeRuntime}`);
  console.log(`    ✓  WebGL vendor: ${vanillaResults.webglVendor || 'N/A'}`);
  console.log(
    `    ✓  WebGL renderer: ${vanillaResults.webglRenderer || 'N/A'}`
  );
  console.log(
    `    ${vanillaResults.outerWidth ? '✓' : '⚠️'}  Outer dimensions: ${vanillaResults.outerWidth}x${vanillaResults.outerHeight}`
  );
  console.log(`    ✓  Platform: ${vanillaResults.platform}`);
  console.log(`    ✓  Vendor: ${vanillaResults.vendor}`);
  console.log(
    `    ✓  Hardware concurrency: ${vanillaResults.hardwareConcurrency}`
  );

  await vanillaBrowser.close();

  // Test 2: With Basic Evasions
  console.log('\n  2️⃣  WITH BASIC EVASIONS');
  console.log('  ' + '-'.repeat(76));

  const stealthBrowser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: [
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-component-extensions-with-background-pages',
    ],
  });
  const stealthPage = await stealthBrowser.newPage();

  // Apply comprehensive evasions
  await stealthPage.evaluateOnNewDocument(() => {
    // 1. Remove navigator.webdriver
    if (navigator.webdriver) {
      delete Object.getPrototypeOf(navigator).webdriver;
    }

    // 2. Ensure window.chrome exists (will be set properly by chrome.app, chrome.runtime evasions)
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {},
      });
    }

    // 3. Fix outer dimensions
    if (!window.outerWidth || window.outerWidth === 0) {
      const windowFrame = 85;
      window.outerWidth = window.innerWidth;
      window.outerHeight = window.innerHeight + windowFrame;
    }
  });

  await stealthPage.goto('about:blank');

  const stealthResults = await stealthPage.evaluate(() => {
    const results = {};

    results.webdriverPresent = 'webdriver' in navigator;
    results.webdriverValue = navigator.webdriver;
    results.userAgent = navigator.userAgent;
    results.hasHeadlessChrome = navigator.userAgent.includes('HeadlessChrome');
    results.pluginsLength = navigator.plugins.length;
    results.pluginsArray = Array.from(navigator.plugins).map(p => p.name);
    results.languages = navigator.languages;
    results.hasChromeObject = typeof window.chrome !== 'undefined';
    results.hasChromeRuntime = typeof window.chrome?.runtime !== 'undefined';

    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          results.webglVendor = gl.getParameter(
            debugInfo.UNMASKED_VENDOR_WEBGL
          );
          results.webglRenderer = gl.getParameter(
            debugInfo.UNMASKED_RENDERER_WEBGL
          );
        }
      }
    } catch (err) {
      results.webglError = err.message;
    }

    results.outerWidth = window.outerWidth;
    results.outerHeight = window.outerHeight;
    results.platform = navigator.platform;
    results.vendor = navigator.vendor;
    results.hardwareConcurrency = navigator.hardwareConcurrency;

    return results;
  });

  console.log('  Results:');
  console.log(
    `    ✓  navigator.webdriver: ${stealthResults.webdriverValue} (${stealthResults.webdriverPresent ? 'PRESENT' : 'ABSENT'})`
  );
  console.log(
    `    ${!stealthResults.hasHeadlessChrome ? '✓' : '⚠️'}  User agent has HeadlessChrome: ${stealthResults.hasHeadlessChrome}`
  );
  console.log(`    ✓  Plugins: ${stealthResults.pluginsLength}`);
  console.log(`    ✓  Languages: ${JSON.stringify(stealthResults.languages)}`);
  console.log(`    ✓  window.chrome: ${stealthResults.hasChromeObject}`);
  console.log(`    ✓  chrome.runtime: ${stealthResults.hasChromeRuntime}`);
  console.log(`    ✓  WebGL vendor: ${stealthResults.webglVendor || 'N/A'}`);
  console.log(
    `    ✓  WebGL renderer: ${stealthResults.webglRenderer || 'N/A'}`
  );
  console.log(
    `    ✓  Outer dimensions: ${stealthResults.outerWidth}x${stealthResults.outerHeight}`
  );
  console.log(`    ✓  Platform: ${stealthResults.platform}`);
  console.log(`    ✓  Vendor: ${stealthResults.vendor}`);
  console.log(
    `    ✓  Hardware concurrency: ${stealthResults.hardwareConcurrency}`
  );

  await stealthBrowser.close();

  // Test 3: Comparison
  console.log('\n  3️⃣  COMPARISON & ANALYSIS');
  console.log('  ' + '-'.repeat(76));

  const improvements = [];
  const remaining = [];

  if (
    vanillaResults.webdriverValue === true &&
    (stealthResults.webdriverValue === false ||
      stealthResults.webdriverValue === undefined)
  ) {
    improvements.push('navigator.webdriver removed ✓');
  } else if (vanillaResults.webdriverValue === true) {
    remaining.push('navigator.webdriver still present ⚠️');
  }

  if (vanillaResults.hasHeadlessChrome && !stealthResults.hasHeadlessChrome) {
    improvements.push('HeadlessChrome removed from UA ✓');
  } else if (stealthResults.hasHeadlessChrome) {
    remaining.push('HeadlessChrome still in UA ⚠️');
  }

  if (!vanillaResults.outerWidth && stealthResults.outerWidth > 0) {
    improvements.push('Outer dimensions fixed ✓');
  }

  console.log('\n  Improvements with evasions:');
  if (improvements.length > 0) {
    for (const imp of improvements) {
      console.log(`    ✓ ${imp}`);
    }
  } else {
    console.log(
      '    (none detected - vanilla may already have some protections)'
    );
  }

  console.log('\n  Remaining detection vectors:');
  if (remaining.length > 0) {
    for (const rem of remaining) {
      console.log(`    ⚠️  ${rem}`);
    }
  } else {
    console.log('    ✓ All tested vectors appear clean!');
  }

  return {
    vanilla: vanillaResults,
    stealth: stealthResults,
    improvements,
    remaining,
  };
}

/**
 * Test Paul Irish headless detection
 */
async function testPaulIrishDetection() {
  console.log('\n📍 Paul Irish Cat & Mouse Detection Tests');
  console.log('-'.repeat(80));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
    ignoreDefaultArgs: [
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-component-extensions-with-background-pages',
    ],
  });
  const page = await browser.newPage();

  await page.evaluateOnNewDocument(() => {
    if (navigator.webdriver) {
      delete Object.getPrototypeOf(navigator).webdriver;
    }
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {},
      });
    }
  });

  await page.goto('about:blank');

  const detectionResults = await page.evaluate(() => {
    const results = {};

    // Test 1: User Agent
    results.userAgent = /HeadlessChrome/.test(window.navigator.userAgent);

    // Test 2: navigator.webdriver
    results.webdriverPresent = 'webdriver' in navigator;
    results.webdriverNotUndefined = navigator.webdriver !== undefined;
    results.webdriverNotFalse = navigator.webdriver !== false;

    // Test 3: window.chrome
    results.chromeMissing =
      /Chrome/.test(window.navigator.userAgent) && !window.chrome;

    // Test 4: navigator.plugins
    results.pluginsEmpty = navigator.plugins.length === 0;

    // Test 5: navigator.languages
    results.languagesBlank = navigator.languages === '';

    return results;
  });

  console.log('\n  Detection Tests:');
  console.log(
    `    ${!detectionResults.userAgent ? '✓' : '✗'} HeadlessChrome in UA: ${detectionResults.userAgent}`
  );
  console.log(
    `    ${!detectionResults.webdriverPresent ? '✓' : '✗'} navigator.webdriver present: ${detectionResults.webdriverPresent}`
  );
  console.log(
    `    ${!detectionResults.chromeMissing ? '✓' : '✗'} window.chrome missing: ${detectionResults.chromeMissing}`
  );
  console.log(
    `    ${!detectionResults.pluginsEmpty ? '✓' : '✗'} navigator.plugins empty: ${detectionResults.pluginsEmpty}`
  );
  console.log(
    `    ${!detectionResults.languagesBlank ? '✓' : '✗'} navigator.languages blank: ${detectionResults.languagesBlank}`
  );

  const passed = Object.values(detectionResults).filter(v => !v).length;
  const total = Object.keys(detectionResults).length;

  console.log(`\n  Result: ${passed}/${total} tests passed`);

  await browser.close();

  return detectionResults;
}

/**
 * Main
 */
async function runTests() {
  const startTime = Date.now();

  try {
    const comparisonResults = await testDetectionChecks();
    const _paulIrishResults = await testPaulIrishDetection();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All local tests completed!');
    console.log(`⏱  Total time: ${duration}s`);
    console.log('\n📊 Summary:');
    console.log(
      `   - Vanilla puppeteer detected: ${comparisonResults.vanilla.webdriverValue === true}`
    );
    console.log(
      `   - With evasions detected: ${comparisonResults.stealth.webdriverValue === true}`
    );
    console.log(`   - Improvements: ${comparisonResults.improvements.length}`);
    console.log(`   - Remaining issues: ${comparisonResults.remaining.length}`);
    console.log('='.repeat(80) + '\n');
  } catch (err) {
    console.error('\n❌ Tests failed:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
