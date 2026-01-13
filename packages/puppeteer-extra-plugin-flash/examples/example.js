import { userInfo } from 'node:os';
import puppeteer from '@zorilla/puppeteer-extra';
import flashPlugin from '@zorilla/puppeteer-extra-plugin-flash';

// This might not be the flashPath you're looking for. ;-)
const userName = userInfo().username;
const pluginPath = `
  /Users/${userName}/Library/Application Support/Google/Chrome/PepperFlash/29.0.0.171/PepperFlashPlayer.plugin
`.trim();
const pluginVersion = '29.0.0.171';

// Will implicitely require 'user-preferences' which will require 'user-data-dir'
// When using default Chromium the pluginPath/pluginVersion need to be specified
puppeteer.use(
  flashPlugin({
    pluginPath,
    pluginVersion,
  })
);

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://ultrasounds.com', { waitUntil: 'domcontentloaded' });
