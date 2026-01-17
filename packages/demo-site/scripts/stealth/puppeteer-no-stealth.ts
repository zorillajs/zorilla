import puppeteer from '@zorilla/puppeteer-extra';

// Interface for detection info result
interface DetectionInfo {
  failedDetections?: string[];
  detectionScore?: string | number | null;
}

// Extend Window type for detection properties
declare global {
  interface Window {
    detectionScore?: number;
    failedDetections?: string[];
  }
}

// Target URL - change to localhost:8787 for local testing
const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8787/challenge';

console.log('🤖 Puppeteer WITHOUT stealth plugin\n');
console.log(`Target: ${TARGET_URL}\n`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// Listen for redirects to /blocked
page.on('response', response => {
  if (response.url().includes('/blocked')) {
    console.log('❌ REDIRECTED TO BLOCKED PAGE - Bot detected!\n');
  }
});

try {
  const response = await page.goto(TARGET_URL, { waitUntil: 'networkidle0' });

  if (!response) {
    throw new Error('Failed to navigate to target URL');
  }

  const url = page.url();
  const status = response.status();

  console.log(`Response status: ${status}`);
  console.log(`Final URL: ${url}`);

  // Check if we got blocked
  if (url.includes('/blocked') || status === 403) {
    console.log('\n🚫 ACCESS DENIED');

    // Try to get detection details
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
    console.log('\n✅ ACCESS GRANTED (unexpected!)');

    const secretData = await page.evaluate(() => {
      return {
        contentVisible: !!document.querySelector('#secret-content'),
        score: window.detectionScore,
      };
    });

    console.log('Secret content visible:', secretData.contentVisible);
    console.log('Detection Score:', secretData.score);
  }

  await page.screenshot({ path: 'puppeteer-no-stealth.png', fullPage: true });
  console.log('\n📸 Screenshot saved: puppeteer-no-stealth.png');
} catch (error) {
  console.error(
    '\n❌ ERROR:',
    error instanceof Error ? error.message : String(error)
  );
}

await browser.close();
console.log('\n✅ Browser closed');
