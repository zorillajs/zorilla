import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from 'puppeteer';

interface PluginOptions {
  stripHeadless?: boolean;
  makeWindows?: boolean;
  customFn?: ((ua: string) => string) | null;
  [key: string]: unknown;
}

/**
 * Anonymize the User-Agent on all pages.
 *
 * Supports dynamic replacing, so the Chrome version stays intact and recent.
 *
 * @param {Object} opts - Options
 * @param {boolean} [opts.stripHeadless=true] - Replace `HeadlessChrome` with `Chrome`.
 * @param {boolean} [opts.makeWindows=true] - Sets the platform to Windows 10, 64bit (most common).
 * @param {Function} [opts.customFn=null] - A custom UA replacer function.
 *
 * @example
 * import puppeteer from '@zorilla/puppeteer-extra'
 * import anonymizeUaPlugin from '@zorilla/puppeteer-extra-plugin-anonymize-ua'
 * puppeteer.use(anonymizeUaPlugin())
 * // or
 * puppeteer.use(anonymizeUaPlugin({
 *   customFn: (ua) => 'MyCoolAgent/' + ua.replace('Chrome', 'Beer')})
 * )
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'anonymize-ua';
  }

  override get defaults(): PluginOptions {
    return {
      stripHeadless: true,
      makeWindows: true,
      customFn: null,
    };
  }

  override async onPageCreated(page: Page): Promise<void> {
    let ua = await page.browser().userAgent();
    if (this.opts.stripHeadless) {
      ua = ua.replace('HeadlessChrome/', 'Chrome/');
    }
    if (this.opts.makeWindows) {
      ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)');
    }
    const customFn = (this.opts as PluginOptions).customFn;
    if (customFn) {
      ua = customFn(ua);
    }
    this.debug('new ua', ua);
    await page.setUserAgent(ua);
  }
}

export default function (pluginConfig?: PluginOptions): Plugin {
  return new Plugin(pluginConfig);
}
