//
// With debug logs:
// DEBUG=puppeteer-extra,puppeteer-extra-plugin,puppeteer-extra-plugin:* node example.js
//

// import puppeteer from '@zorilla/puppeteer-extra'
// import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources'
//
// puppeteer.use(blockResourcesPlugin({
//   blockedTypes: new Set(['image', 'stylesheet'])
// }))
// const browser = await puppeteer.launch({ headless: false })
// const page = await browser.newPage()
// await page.goto('http://www.msn.com/', {waitUntil: 'domcontentloaded'})
// console.log('all done')

import puppeteer from '@zorilla/puppeteer-extra';
import blockResourcesPlugin from '@zorilla/puppeteer-extra-plugin-block-resources';
import { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } from 'puppeteer';

const plugin = blockResourcesPlugin({
  // Optionally enable Cooperative Mode for several request interceptors
  interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
});

puppeteer.use(plugin);

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

plugin.blockedTypes.add('image');
await page.goto('http://www.msn.com/', { waitUntil: 'domcontentloaded' });

plugin.blockedTypes.add('stylesheet');
plugin.blockedTypes.add('other'); // e.g. favicon
await page.goto('http://news.ycombinator.com', {
  waitUntil: 'domcontentloaded',
});

plugin.blockedTypes.delete('stylesheet');
plugin.blockedTypes.delete('other');
plugin.blockedTypes.add('media');
plugin.blockedTypes.add('script');
await page.goto('http://www.youtube.com', { waitUntil: 'domcontentloaded' });

console.log('all done');
