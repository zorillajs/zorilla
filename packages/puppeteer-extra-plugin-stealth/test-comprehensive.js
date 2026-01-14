/**
 * Comprehensive manual test script for puppeteer-extra-plugin-stealth
 *
 * This script will:
 * 1. Test vanilla puppeteer (without stealth) on bot detection sites
 * 2. Test with stealth plugin enabled on the same sites
 * 3. Verify each evasion technique is working
 * 4. Generate detailed comparison reports
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { addExtra } from '@zorilla/puppeteer-extra';
import puppeteer from 'puppeteer';
import StealthPlugin from './dist/index.js';

const outputDir = join(process.cwd(), 'test-results');

// Ensure output directory exists
await mkdir(outputDir, { recursive: true });

console.log('🧪 Starting Comprehensive Stealth Plugin Testing\n');
console.log('='.repeat(80));

/**
 * Test 1: Bot Detection Sites - Vanilla vs Stealth
 */
async function testBotDetectionSites() {
  console.log('\n📍 TEST 1: Bot Detection Sites (Vanilla vs Stealth)');
  console.log('-'.repeat(80));

  const testSites = [
    {
      name: 'Sannysoft Bot Detector',
      url: 'https://bot.sannysoft.com',
      waitTime: 5000,
    },
    {
      name: 'Intoli Chrome Headless Test',
      url: 'https://intoli.com/blog/not-possible-to-block-chrome-headless/chrome-headless-test.html',
      waitTime: 3000,
    },
  ];

  for (const site of testSites) {
    console.log(`\n  Testing: ${site.name}`);
    console.log(`  URL: ${site.url}`);

    // Test vanilla puppeteer
    console.log('  → Testing vanilla puppeteer...');
    const vanillaBrowser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const vanillaPage = await vanillaBrowser.newPage();
    await vanillaPage.setViewport({ width: 1280, height: 720 });

    try {
      await vanillaPage.goto(site.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await vanillaPage.waitForTimeout(site.waitTime);

      const vanillaScreenshot = join(
        outputDir,
        `vanilla-${site.name.replace(/\s+/g, '-').toLowerCase()}.png`
      );
      await vanillaPage.screenshot({ path: vanillaScreenshot, fullPage: true });
      console.log(`  ✓ Vanilla screenshot saved: ${vanillaScreenshot}`);
    } catch (err) {
      console.log(`  ✗ Vanilla test failed: ${err.message}`);
    }

    await vanillaBrowser.close();

    // Test with stealth plugin
    console.log('  → Testing with stealth plugin...');
    const stealthPuppeteer = addExtra(puppeteer);
    stealthPuppeteer.use(StealthPlugin());

    const stealthBrowser = await stealthPuppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const stealthPage = await stealthBrowser.newPage();
    await stealthPage.setViewport({ width: 1280, height: 720 });

    try {
      await stealthPage.goto(site.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });
      await stealthPage.waitForTimeout(site.waitTime);

      const stealthScreenshot = join(
        outputDir,
        `stealth-${site.name.replace(/\s+/g, '-').toLowerCase()}.png`
      );
      await stealthPage.screenshot({ path: stealthScreenshot, fullPage: true });
      console.log(`  ✓ Stealth screenshot saved: ${stealthScreenshot}`);
    } catch (err) {
      console.log(`  ✗ Stealth test failed: ${err.message}`);
    }

    await stealthBrowser.close();
  }
}

/**
 * Test 2: Individual Evasion Verification
 */
async function testIndividualEvasions() {
  console.log('\n📍 TEST 2: Individual Evasion Verification');
  console.log('-'.repeat(80));

  const stealthPuppeteer = addExtra(puppeteer);
  stealthPuppeteer.use(StealthPlugin());

  const browser = await stealthPuppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  // Navigate to a simple page for testing
  await page.goto('about:blank');

  const evasionTests = [
    {
      name: 'navigator.webdriver',
      test: async () => {
        const webdriver = await page.evaluate(() => navigator.webdriver);
        return webdriver === undefined || webdriver === false;
      },
    },
    {
      name: 'user-agent',
      test: async () => {
        const ua = await page.evaluate(() => navigator.userAgent);
        return !ua.includes('HeadlessChrome');
      },
    },
    {
      name: 'navigator.plugins',
      test: async () => {
        const pluginsLength = await page.evaluate(
          () => navigator.plugins.length
        );
        return pluginsLength > 0;
      },
    },
    {
      name: 'navigator.languages',
      test: async () => {
        const languages = await page.evaluate(() => navigator.languages);
        return Array.isArray(languages) && languages.length > 0;
      },
    },
    {
      name: 'window.chrome',
      test: async () => {
        const hasChrome = await page.evaluate(
          () => typeof window.chrome !== 'undefined'
        );
        return hasChrome;
      },
    },
    {
      name: 'chrome.runtime',
      test: async () => {
        // Navigate to an https page for this test
        await page.goto('https://example.com');
        const hasChromeRuntime = await page.evaluate(
          () => window.chrome && typeof window.chrome.runtime !== 'undefined'
        );
        await page.goto('about:blank');
        return hasChromeRuntime;
      },
    },
    {
      name: 'navigator.permissions',
      test: async () => {
        const permissionsQuery = await page.evaluate(async () => {
          try {
            const result = await navigator.permissions.query({
              name: 'notifications',
            });
            return result && typeof result.state === 'string';
          } catch (_err) {
            return false;
          }
        });
        return permissionsQuery;
      },
    },
    {
      name: 'window.outerWidth/outerHeight',
      test: async () => {
        const dimensions = await page.evaluate(() => ({
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
        }));
        return dimensions.outerWidth > 0 && dimensions.outerHeight > 0;
      },
    },
    {
      name: 'WebGL vendor',
      test: async () => {
        const vendor = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          const gl =
            canvas.getContext('webgl') ||
            canvas.getContext('experimental-webgl');
          if (!gl) return null;
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          if (!debugInfo) return null;
          return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        });
        return vendor && vendor !== 'Google Inc.' && vendor !== 'Brian Paul';
      },
    },
    {
      name: 'navigator.hardwareConcurrency',
      test: async () => {
        const hwc = await page.evaluate(() => navigator.hardwareConcurrency);
        return typeof hwc === 'number' && hwc >= 1;
      },
    },
  ];

  console.log('\n  Running evasion tests...\n');

  const results = {};
  for (const evasionTest of evasionTests) {
    try {
      const passed = await evasionTest.test();
      results[evasionTest.name] = passed;
      console.log(
        `  ${passed ? '✓' : '✗'} ${evasionTest.name}: ${passed ? 'PASS' : 'FAIL'}`
      );
    } catch (err) {
      results[evasionTest.name] = false;
      console.log(`  ✗ ${evasionTest.name}: ERROR - ${err.message}`);
    }
  }

  await browser.close();

  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  console.log(`\n  Summary: ${passedCount}/${totalCount} evasions verified`);

  return results;
}

/**
 * Test 3: Selective Evasion Testing
 */
async function testSelectiveEvasions() {
  console.log('\n📍 TEST 3: Selective Evasion Configuration');
  console.log('-'.repeat(80));

  const stealthPuppeteer = addExtra(puppeteer);
  const plugin = StealthPlugin();

  console.log(`\n  Available evasions: ${plugin.availableEvasions.size}`);
  console.log(`  Enabled evasions: ${plugin.enabledEvasions.size}`);

  // Test disabling specific evasions
  console.log('\n  Testing selective evasion disabling...');
  plugin.enabledEvasions.delete('navigator.webdriver');

  stealthPuppeteer.use(plugin);

  const browser = await stealthPuppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('about:blank');

  const webdriver = await page.evaluate(() => navigator.webdriver);
  const hasPlugins = await page.evaluate(() => navigator.plugins.length > 0);

  console.log(`  ✓ navigator.webdriver disabled: ${webdriver !== undefined}`);
  console.log(`  ✓ Other evasions still work: ${hasPlugins}`);

  await browser.close();
}

/**
 * Test 4: README Examples
 */
async function testReadmeExamples() {
  console.log('\n📍 TEST 4: README Example Verification');
  console.log('-'.repeat(80));

  console.log('\n  Testing basic usage example...');

  // Example from README
  const puppeteerExtra = addExtra(puppeteer);
  puppeteerExtra.use(StealthPlugin());

  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://bot.sannysoft.com', { timeout: 30000 });
    await page.waitForTimeout(5000);

    const screenshot = join(outputDir, 'readme-example-result.png');
    await page.screenshot({ path: screenshot, fullPage: true });
    console.log(`  ✓ README example executed successfully`);
    console.log(`  ✓ Screenshot saved: ${screenshot}`);
  } catch (err) {
    console.log(`  ✗ README example failed: ${err.message}`);
  }

  await browser.close();
}

/**
 * Test 5: Performance and Memory
 */
async function testPerformance() {
  console.log('\n📍 TEST 5: Performance and Memory');
  console.log('-'.repeat(80));

  const runs = 3;
  const vanillaTimes = [];
  const stealthTimes = [];

  // Test vanilla performance
  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    await browser.close();
    vanillaTimes.push(Date.now() - start);
  }

  // Test stealth performance
  for (let i = 0; i < runs; i++) {
    const puppeteerExtra = addExtra(puppeteer);
    puppeteerExtra.use(StealthPlugin());
    const start = Date.now();
    const browser = await puppeteerExtra.launch({
      headless: true,
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    await browser.close();
    stealthTimes.push(Date.now() - start);
  }

  const avgVanilla = vanillaTimes.reduce((a, b) => a + b) / runs;
  const avgStealth = stealthTimes.reduce((a, b) => a + b) / runs;
  const overhead = (((avgStealth - avgVanilla) / avgVanilla) * 100).toFixed(2);

  console.log(`\n  Vanilla average: ${avgVanilla.toFixed(0)}ms`);
  console.log(`  Stealth average: ${avgStealth.toFixed(0)}ms`);
  console.log(`  Overhead: ${overhead}%`);
}

/**
 * Test 6: Edge Cases and Compatibility
 */
async function testEdgeCases() {
  console.log('\n📍 TEST 6: Edge Cases and Compatibility');
  console.log('-'.repeat(80));

  const puppeteerExtra = addExtra(puppeteer);
  puppeteerExtra.use(StealthPlugin());

  // Test 6.1: Multiple pages
  console.log('\n  Testing multiple pages...');
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page1 = await browser.newPage();
  const page2 = await browser.newPage();
  const page3 = await browser.newPage();

  await Promise.all([
    page1.goto('https://example.com'),
    page2.goto('https://example.com'),
    page3.goto('https://example.com'),
  ]);

  const results = await Promise.all([
    page1.evaluate(() => navigator.webdriver),
    page2.evaluate(() => navigator.webdriver),
    page3.evaluate(() => navigator.webdriver),
  ]);

  const allUndefined = results.every(r => r === undefined || r === false);
  console.log(`  ✓ Multiple pages work correctly: ${allUndefined}`);

  await browser.close();

  // Test 6.2: Different protocols
  console.log('\n  Testing different protocols...');
  const browser2 = await puppeteerExtra.launch({
    headless: true,
    args: ['--no-sandbox'],
  });
  const page = await browser2.newPage();

  // HTTP
  await page.goto('http://example.com');
  let webdriver = await page.evaluate(() => navigator.webdriver);
  console.log(
    `  ✓ HTTP works: ${webdriver === undefined || webdriver === false}`
  );

  // HTTPS
  await page.goto('https://example.com');
  webdriver = await page.evaluate(() => navigator.webdriver);
  console.log(
    `  ✓ HTTPS works: ${webdriver === undefined || webdriver === false}`
  );

  // about:blank
  await page.goto('about:blank');
  webdriver = await page.evaluate(() => navigator.webdriver);
  console.log(
    `  ✓ about:blank works: ${webdriver === undefined || webdriver === false}`
  );

  await browser2.close();
}

/**
 * Main test runner
 */
async function runAllTests() {
  const startTime = Date.now();

  try {
    await testBotDetectionSites();
    await testIndividualEvasions();
    await testSelectiveEvasions();
    await testReadmeExamples();
    await testPerformance();
    await testEdgeCases();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log(`⏱  Total time: ${duration}s`);
    console.log(`📁 Results saved to: ${outputDir}`);
    console.log('='.repeat(80) + '\n');
  } catch (err) {
    console.error('\n❌ Test suite failed with error:');
    console.error(err);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
