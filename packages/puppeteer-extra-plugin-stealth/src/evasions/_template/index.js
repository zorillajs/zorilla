import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';

/**
 * Minimal stealth plugin template, not being used. :-)
 *
 * Feel free to copy this folder as the basis for additional detection evasion plugins.
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts = {}) {
    super(opts);
  }

  get name() {
    return 'stealth/evasions/_template';
  }

  async onPageCreated(page) {
    await page.evaluateOnNewDocument(() => {
      console.debug('hello world');
    });
  }
}

export default function (pluginConfig) {
  return new Plugin(pluginConfig);
}
