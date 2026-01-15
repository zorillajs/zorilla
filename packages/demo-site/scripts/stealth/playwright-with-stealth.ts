import { chromium } from '@zorilla/playwright-extra';
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth';

interface DetectionTest {
  name: string;
  passed: boolean;
  severity: string;
}

// Interface for detection info result
interface DetectionInfo {
  failedDetections?: string[];
  detectionScore?: string | number | null;
}

// Extend Window type for detection properties
declare global {
  interface Window {
    detectionScore?: number;
    detectionResults?: DetectionTest[];
    failedDetections?: string[];
  }
}

// Enable stealth plugin
chromium.use(StealthPlugin());

// Target URL - change to localhost:8787 for local testing
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8787/api/secret';

console.log('🥷 Playwright WITH stealth plugin\n');
console.log(`Target: ${TARGET_URL}\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

try {
  const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle' });

  if (!response) {
    throw new Error('Failed to navigate to target URL');
  }

  const url = page.url();
  const status = response.status();

  console.log(`Response status: ${status}`);
  console.log(`Final URL: ${url}`);

  // Check if we got blocked
  if (url.includes('/blocked') || status === 403) {
    console.log('\n🚫 ACCESS DENIED (stealth plugin may need updates)');

    const detectionInfo: DetectionInfo = await page
      .evaluate(() => {
        return {
          failedDetections: window.failedDetections || [],
          detectionScore:
            window.detectionScore || sessionStorage.getItem('detectionScore'),
        };
      })
      .catch(() => ({}));

    if (detectionInfo.detectionScore) {
      console.log(`Detection Score: ${detectionInfo.detectionScore} / 124`);
    }

    if (
      detectionInfo.failedDetections &&
      detectionInfo.failedDetections.length > 0
    ) {
      console.log('\nFailed detection checks:');
      for (const check of detectionInfo.failedDetections) {
        console.log(`  - ${check}`);
      }
    }
  } else {
    console.log('\n✅ ACCESS GRANTED - Stealth plugin worked!');

    const secretData = await page.evaluate(() => {
      const contentEl = document.querySelector('#secret-content');
      const apiResponseEl = document.querySelector('#api-response');

      return {
        contentVisible: contentEl ? (contentEl as HTMLElement).style.display !== 'none' : false,
        apiResponse: apiResponseEl ? apiResponseEl.textContent : null,
        score: window.detectionScore,
        tests: window.detectionResults,
      };
    });

    console.log('\n🎉 Secret content retrieved!');
    console.log(`📊 Detection Score: ${secretData.score} / 124`);

    if (secretData.tests) {
      const passed = secretData.tests.filter(t => t.passed).length;
      const failed = secretData.tests.filter(t => !t.passed).length;
      console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

      if (failed > 0) {
        console.log('\nFailed tests:');
        const failedTests = secretData.tests.filter(t => !t.passed);
        for (const t of failedTests) {
          console.log(`  - ${t.name} (${t.severity})`);
        }
      }
    }
  }

  await page.screenshot({
    path: 'playwright-with-stealth.png',
    fullPage: true,
  });
  console.log('\n📸 Screenshot saved: playwright-with-stealth.png');
} catch (error) {
  console.error('\n❌ ERROR:', error instanceof Error ? error.message : String(error));
}

await browser.close();
console.log('\n✅ Browser closed');
