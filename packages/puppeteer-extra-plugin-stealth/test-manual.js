/**
 * Manual test script for puppeteer-extra-plugin-stealth
 * Tests core functionality directly
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const outputDir = join(process.cwd(), 'test-results');
await mkdir(outputDir, { recursive: true });

console.log('🧪 Manual Stealth Plugin Testing\n');
console.log('='.repeat(80));

/**
 * Helper to wait
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Test individual evasion techniques in the browser
 */
async function testEvasions() {
  console.log('\n📍 Testing Individual Evasions in Browser');
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

  // Inject all evasions manually before navigation
  await page.evaluateOnNewDocument(() => {
    // navigator.webdriver
    if (navigator.webdriver === true) {
      delete Object.getPrototypeOf(navigator).webdriver;
    }

    // window.chrome
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {},
      });
    }

    // Plugins mock (simplified)
    if (navigator.plugins.length === 0) {
      console.log('Would add plugins mock here');
    }

    // outerDimensions
    if (!window.outerWidth) {
      window.outerWidth = window.innerWidth;
      window.outerHeight = window.innerHeight + 85;
    }
  });

  await page.goto('https://example.com');

  // Test results
  const results = await page.evaluate(() => {
    return {
      webdriver: navigator.webdriver,
      userAgent: navigator.userAgent,
      pluginsLength: navigator.plugins.length,
      languages: navigator.languages,
      hasChrome: typeof window.chrome !== 'undefined',
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };
  });

  console.log('\n  Results:');
  console.log(`  - navigator.webdriver: ${results.webdriver}`);
  console.log(
    `  - User agent contains HeadlessChrome: ${results.userAgent.includes('HeadlessChrome')}`
  );
  console.log(`  - Plugins count: ${results.pluginsLength}`);
  console.log(`  - Languages: ${JSON.stringify(results.languages)}`);
  console.log(`  - Has window.chrome: ${results.hasChrome}`);
  console.log(
    `  - Outer dimensions: ${results.outerWidth}x${results.outerHeight}`
  );
  console.log(`  - Hardware concurrency: ${results.hardwareConcurrency}`);

  await browser.close();
}

/**
 * Test on actual bot detection site
 */
async function testBotDetection() {
  console.log('\n📍 Testing on Bot Detection Site');
  console.log('-'.repeat(80));

  console.log('\n  Testing vanilla puppeteer...');
  const vanillaBrowser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const vanillaPage = await vanillaBrowser.newPage();
  await vanillaPage.setViewport({ width: 1280, height: 720 });

  try {
    await vanillaPage.goto('https://bot.sannysoft.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await wait(5000);

    // Check key indicators
    const vanillaResults = await vanillaPage.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        userAgent: navigator.userAgent,
        pluginsLength: navigator.plugins.length,
        hasChrome: typeof window.chrome !== 'undefined',
      };
    });

    console.log('  Vanilla Results:');
    console.log(`    - webdriver: ${vanillaResults.webdriver}`);
    console.log(
      `    - userAgent has HeadlessChrome: ${vanillaResults.userAgent.includes('HeadlessChrome')}`
    );
    console.log(`    - plugins: ${vanillaResults.pluginsLength}`);
    console.log(`    - has window.chrome: ${vanillaResults.hasChrome}`);

    const vanillaScreenshot = join(outputDir, 'vanilla-bot-detection.png');
    await vanillaPage.screenshot({ path: vanillaScreenshot, fullPage: true });
    console.log(`  ✓ Screenshot saved: ${vanillaScreenshot}`);
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
  }

  await vanillaBrowser.close();

  console.log('\n  Testing with manual evasions...');
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
  await stealthPage.setViewport({ width: 1280, height: 720 });

  // Apply evasions
  await stealthPage.evaluateOnNewDocument(() => {
    // Remove webdriver
    if (navigator.webdriver) {
      delete Object.getPrototypeOf(navigator).webdriver;
    }

    // Add window.chrome
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {
          runtime: {},
        },
      });
    }

    // Fix outerDimensions
    if (!window.outerWidth) {
      window.outerWidth = window.innerWidth;
      window.outerHeight = window.innerHeight + 85;
    }
  });

  try {
    await stealthPage.goto('https://bot.sannysoft.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await wait(5000);

    const stealthResults = await stealthPage.evaluate(() => {
      return {
        webdriver: navigator.webdriver,
        userAgent: navigator.userAgent,
        pluginsLength: navigator.plugins.length,
        hasChrome: typeof window.chrome !== 'undefined',
      };
    });

    console.log('  Stealth Results:');
    console.log(`    - webdriver: ${stealthResults.webdriver}`);
    console.log(
      `    - userAgent has HeadlessChrome: ${stealthResults.userAgent.includes('HeadlessChrome')}`
    );
    console.log(`    - plugins: ${stealthResults.pluginsLength}`);
    console.log(`    - has window.chrome: ${stealthResults.hasChrome}`);

    const stealthScreenshot = join(outputDir, 'stealth-bot-detection.png');
    await stealthPage.screenshot({ path: stealthScreenshot, fullPage: true });
    console.log(`  ✓ Screenshot saved: ${stealthScreenshot}`);
  } catch (err) {
    console.log(`  ✗ Failed: ${err.message}`);
  }

  await stealthBrowser.close();
}

/**
 * Compare headless vs headful
 */
async function compareHeadlessHeadful() {
  console.log('\n📍 Comparing Headless vs Headful');
  console.log('-'.repeat(80));

  // Headless
  console.log('\n  Testing headless mode...');
  const headlessBrowser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const headlessPage = await headlessBrowser.newPage();
  await headlessPage.goto('https://example.com');

  const headlessResults = await headlessPage.evaluate(() => {
    return {
      webdriver: navigator.webdriver,
      userAgent: navigator.userAgent,
      pluginsLength: navigator.plugins.length,
      languages: navigator.languages,
      hasChrome: typeof window.chrome !== 'undefined',
      platform: navigator.platform,
      vendor: navigator.vendor,
    };
  });

  await headlessBrowser.close();

  console.log('  Headless Results:');
  console.log(`    - webdriver: ${headlessResults.webdriver}`);
  console.log(
    `    - userAgent: ${headlessResults.userAgent.substring(0, 60)}...`
  );
  console.log(`    - plugins: ${headlessResults.pluginsLength}`);
  console.log(`    - languages: ${JSON.stringify(headlessResults.languages)}`);
  console.log(`    - has chrome: ${headlessResults.hasChrome}`);
  console.log(`    - platform: ${headlessResults.platform}`);
  console.log(`    - vendor: ${headlessResults.vendor}`);

  console.log('\n  Key observations:');
  console.log(
    `    - HeadlessChrome in UA: ${headlessResults.userAgent.includes('HeadlessChrome')}`
  );
  console.log(`    - Empty plugins: ${headlessResults.pluginsLength === 0}`);
  console.log(`    - Missing chrome object: ${!headlessResults.hasChrome}`);
}

/**
 * Main test runner
 */
async function runTests() {
  const startTime = Date.now();

  try {
    await testEvasions();
    await testBotDetection();
    await compareHeadlessHeadful();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Manual tests completed!');
    console.log(`⏱  Total time: ${duration}s`);
    console.log(`📁 Results saved to: ${outputDir}`);
    console.log('='.repeat(80) + '\n');
  } catch (err) {
    console.error('\n❌ Tests failed:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
