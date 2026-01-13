import puppeteer from '@zorilla/puppeteer-extra';
import clickAndWaitPlugin from '@zorilla/puppeteer-extra-plugin-click-and-wait';

puppeteer.use(clickAndWaitPlugin());

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('https://example.com/', { waitUntil: 'domcontentloaded' });
console.log('clicking on first link');
await page.clickAndWaitForNavigation('a');
console.log('all done');
