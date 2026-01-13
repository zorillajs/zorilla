import puppeteer from '@zorilla/puppeteer-extra';
import stealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth';
import detectHeadless from './detect-headless.js';

puppeteer.use(stealthPlugin());

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('console', msg => {
  console.log('Page console: ', msg.text());
});

await page.goto('about:blank');
const detectionResults = await page.evaluate(detectHeadless);
console.assert(
  Object.keys(detectionResults).length,
  'No detection results returned.'
);

await browser.close();
