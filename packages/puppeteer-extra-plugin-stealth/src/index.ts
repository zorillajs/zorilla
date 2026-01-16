import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type * as Puppeteer from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';

interface PluginOptions {
  enabledEvasions?: Set<string>;
  availableEvasions?: Set<string>;
  [key: string]: unknown;
}

interface BrowserOptions {
  [key: string]: unknown;
}

/**
 * Stealth mode: Applies various techniques to make detection of headless puppeteer harder. 💯
 *
 * ### Purpose
 * There are a couple of ways the use of puppeteer can easily be detected by a target website.
 * The addition of `HeadlessChrome` to the user-agent being only the most obvious one.
 *
 * The goal of this plugin is to be the definite companion to puppeteer to avoid
 * detection, applying new techniques as they surface.
 *
 * As this cat & mouse game is in it's infancy and fast-paced the plugin
 * is kept as flexibile as possible, to support quick testing and iterations.
 *
 * ### Modularity
 * This plugin uses `puppeteer-extra`'s dependency system to only require
 * code mods for evasions that have been enabled, to keep things modular and efficient.
 *
 * The `stealth` plugin is a convenience wrapper that requires multiple [evasion techniques](./evasions/)
 * automatically and comes with defaults. You could also bypass the main module and require
 * specific evasion plugins yourself, if you whish to do so (as they're standalone `puppeteer-extra` plugins):
 *
 * ```es6
 * // bypass main module and require a specific stealth plugin directly:
 * puppeteer.use(require('@zorilla/puppeteer-extra-plugin-stealth/evasions/console.debug')())
 * ```
 *
 * ### Contributing
 * PRs are welcome, if you want to add a new evasion technique I suggest you
 * look at the [template](./evasions/_template) to kickstart things.
 *
 * ### Kudos
 * Thanks to [Evan Sangaline](https://intoli.com/blog/not-possible-to-block-chrome-headless/) and [Paul Irish](https://github.com/paulirish/headless-cat-n-mouse) for kickstarting the discussion!
 *
 * ---
 *
 * @todo
 * - white-/blacklist with url globs (make this a generic plugin method?)
 * - dynamic whitelist based on function evaluation
 *
 * @example
 * import puppeteer from '@zorilla/puppeteer-extra'
 * import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
 *
 * // Enable stealth plugin with all evasions
 * puppeteer.use(StealthPlugin())
 *
 * // Launch the browser in headless mode and set up a page.
 * const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
 * const page = await browser.newPage()
 *
 * // Navigate to the page that will perform the tests.
 * const testUrl = 'https://intoli.com/blog/' +
 *   'not-possible-to-block-chrome-headless/chrome-headless-test.html'
 * await page.goto(testUrl)
 *
 * // Save a screenshot of the results.
 * const screenshotPath = '/tmp/headless-test-result.png'
 * await page.screenshot({ path: screenshotPath })
 * console.log('have a look at the screenshot:', screenshotPath)
 *
 * await browser.close()
 *
 * @param {Object} [opts] - Options
 * @param {Set<string>} [opts.enabledEvasions] - Specify which evasions to use (by default all)
 *
 */
class StealthPlugin extends PuppeteerExtraPlugin {
  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth';
  }

  override get defaults(): Required<PluginOptions> {
    const availableEvasions = new Set([
      'chrome.app',
      'chrome.csi',
      'chrome.loadTimes',
      'chrome.runtime',
      'defaultArgs',
      'iframe.contentWindow',
      'media.codecs',
      'navigator.hardwareConcurrency',
      'navigator.languages',
      'navigator.permissions',
      'navigator.plugins',
      'navigator.vendor',
      'navigator.webdriver',
      'sourceurl',
      'user-agent-override',
      'webgl.vendor',
      'window.outerdimensions',
    ]);
    return {
      availableEvasions,
      // Enable all available evasions by default
      enabledEvasions: new Set([...availableEvasions]),
    };
  }

  /**
   * Requires evasion techniques dynamically based on configuration.
   *
   * @private
   */
  override get dependencies(): Set<string> {
    const enabledEvasions = this.opts.enabledEvasions as Set<string>;
    return new Set([...enabledEvasions].map(e => `${this.name}/evasions/${e}`));
  }

  /**
   * Get all available evasions.
   *
   * Please look into the [evasions directory](./evasions/) for an up to date list.
   *
   * @type {Set<string>} - A Set of all available evasions.
   *
   * @example
   * import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
   *
   * const pluginStealth = StealthPlugin()
   * console.log(pluginStealth.availableEvasions) // => Set { 'user-agent', 'console.debug' }
   * puppeteer.use(pluginStealth)
   */
  get availableEvasions(): Set<string> {
    return this.defaults.availableEvasions;
  }

  /**
   * Get all enabled evasions.
   *
   * Enabled evasions can be configured either through `opts` or by modifying this property.
   *
   * @type {Set<string>} - A Set of all enabled evasions.
   *
   * @example
   * import StealthPlugin from '@zorilla/puppeteer-extra-plugin-stealth'
   *
   * // Remove specific evasion from enabled ones dynamically
   * const pluginStealth = StealthPlugin()
   * pluginStealth.enabledEvasions.delete('console.debug')
   * puppeteer.use(pluginStealth)
   */
  get enabledEvasions(): Set<string> {
    return this.opts.enabledEvasions as Set<string>;
  }

  /**
   * @private
   */
  set enabledEvasions(evasions: Set<string>) {
    this.opts.enabledEvasions = evasions;
  }

  override async onBrowser(
    browser: Puppeteer.Browser,
    _opts: BrowserOptions
  ): Promise<void> {
    // Browser extends EventEmitter, increase listeners to prevent MaxListenersExceededWarning
    // Type guard to safely access EventEmitter methods
    if (
      'setMaxListeners' in browser &&
      typeof browser.setMaxListeners === 'function'
    ) {
      browser.setMaxListeners(30);
    }
  }
}

/**
 * Default export, PuppeteerExtraStealthPlugin
 *
 * @param {Object} [opts] - Options
 * @param {Set<string>} [opts.enabledEvasions] - Specify which evasions to use (by default all)
 */
export default (opts?: PluginOptions): StealthPlugin => new StealthPlugin(opts);

// Named export
export { StealthPlugin };
