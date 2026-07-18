import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { platform } from 'node:os';
import { join } from 'node:path';
import { addExtra as addPlaywright } from '@zorilla/playwright-extra';
import { addExtra as addPuppeteer } from '@zorilla/puppeteer-extra';
import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth';
import playwright from 'playwright';
import puppeteer from 'puppeteer';
import {
  type ConformanceResult,
  type Framework,
  formatReport,
  runConformance,
} from './index.js';

const require = createRequire(import.meta.url);
const outputDirectory = join(import.meta.dirname, '..', 'results');
const fixture = 'data:text/html,<title>Zorilla conformance fixture</title>';

async function execute(framework: Framework): Promise<ConformanceResult> {
  const args = process.env.CI
    ? ['--no-sandbox', '--disable-setuid-sandbox']
    : [];
  if (framework === 'puppeteer') {
    const launcher = addPuppeteer(puppeteer).use(StealthPlugin());
    const browser = await launcher.launch({ headless: true, args });
    try {
      const page = await browser.newPage();
      await page.goto(fixture);
      return await runConformance(expression => page.evaluate(expression), {
        browser: 'chromium',
        browserVersion: await browser.version(),
        framework,
        frameworkVersion: require('puppeteer/package.json').version,
        backend: 'standard',
        headless: 'headless',
        os: platform(),
        enabledPlugins: ['stealth'],
        identitySeed: null,
      });
    } finally {
      await browser.close();
    }
  }
  const launcher = addPlaywright(playwright.chromium).use(StealthPlugin());
  const browser = await launcher.launch({ headless: true, args });
  try {
    const page = await browser.newPage();
    await page.goto(fixture);
    return await runConformance(expression => page.evaluate(expression), {
      browser: 'chromium',
      browserVersion: browser.version(),
      framework,
      frameworkVersion: require('playwright/package.json').version,
      backend: 'standard',
      headless: 'headless',
      os: platform(),
      enabledPlugins: ['stealth'],
      identitySeed: null,
    });
  } finally {
    await browser.close();
  }
}

await mkdir(outputDirectory, { recursive: true });
let failed = false;
for (const framework of ['puppeteer', 'playwright'] as const) {
  const result = await execute(framework);
  await writeFile(
    join(outputDirectory, `${framework}.json`),
    `${JSON.stringify(result, null, 2)}\n`
  );
  await writeFile(
    join(outputDirectory, `${framework}.md`),
    formatReport(result)
  );
  console.log(
    `${framework}: ${result.summary.passed}/${result.summary.total} probes passed`
  );
  failed ||= result.summary.failed > 0;
}
if (failed) process.exitCode = 1;
