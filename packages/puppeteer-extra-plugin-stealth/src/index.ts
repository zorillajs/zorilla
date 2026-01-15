import type { EventEmitter } from 'node:events';
import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type * as Puppeteer from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';
import type {
  ConnectOptions,
  LaunchOptions,
  Page,
} from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';

// Import all evasions statically
import chromeApp from './evasions/chrome.app/index.js';
import chromeCsi from './evasions/chrome.csi/index.js';
import chromeLoadTimes from './evasions/chrome.loadTimes/index.js';
import chromeRuntime from './evasions/chrome.runtime/index.js';
import defaultArgs from './evasions/defaultArgs/index.js';
import iframeContentWindow from './evasions/iframe.contentWindow/index.js';
import mediaCodecs from './evasions/media.codecs/index.js';
import navigatorHardwareConcurrency from './evasions/navigator.hardwareConcurrency/index.js';
import navigatorLanguages from './evasions/navigator.languages/index.js';
import navigatorPermissions from './evasions/navigator.permissions/index.js';
import navigatorPlugins from './evasions/navigator.plugins/index.js';
import navigatorVendor from './evasions/navigator.vendor/index.js';
import navigatorWebdriver from './evasions/navigator.webdriver/index.js';
import sourceurl from './evasions/sourceurl/index.js';
import userAgentOverride from './evasions/user-agent-override/index.js';
import webglVendor from './evasions/webgl.vendor/index.js';
import windowOuterdimensions from './evasions/window.outerdimensions/index.js';

// Type for evasion factory functions
// Note: Evasion plugins extend PuppeteerExtraPlugin but may have varying implementations
// Using Record with function signature to maintain type safety while allowing flexibility
type EvasionFactory = (opts?: unknown) => PuppeteerExtraPlugin;

// Map of evasion names to their implementations
// Using double assertion to handle minor type incompatibilities between evasion implementations
const EVASION_MODULES: Record<string, EvasionFactory> = {
  'chrome.app': chromeApp as unknown as EvasionFactory,
  'chrome.csi': chromeCsi as unknown as EvasionFactory,
  'chrome.loadTimes': chromeLoadTimes as unknown as EvasionFactory,
  'chrome.runtime': chromeRuntime as unknown as EvasionFactory,
  defaultArgs: defaultArgs as unknown as EvasionFactory,
  'iframe.contentWindow': iframeContentWindow as unknown as EvasionFactory,
  'media.codecs': mediaCodecs as unknown as EvasionFactory,
  'navigator.hardwareConcurrency':
    navigatorHardwareConcurrency as unknown as EvasionFactory,
  'navigator.languages': navigatorLanguages as unknown as EvasionFactory,
  'navigator.permissions': navigatorPermissions as unknown as EvasionFactory,
  'navigator.plugins': navigatorPlugins as unknown as EvasionFactory,
  'navigator.vendor': navigatorVendor as unknown as EvasionFactory,
  'navigator.webdriver': navigatorWebdriver as unknown as EvasionFactory,
  sourceurl: sourceurl as unknown as EvasionFactory,
  'user-agent-override': userAgentOverride as unknown as EvasionFactory,
  'webgl.vendor': webglVendor as unknown as EvasionFactory,
  'window.outerdimensions': windowOuterdimensions as unknown as EvasionFactory,
};

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
 * const puppeteer = require('@zorilla/puppeteer-extra')
 * // Enable stealth plugin with all evasions
 * puppeteer.use(require('@zorilla/puppeteer-extra-plugin-stealth')())
 *
 *
 * ;(async () => {
 *   // Launch the browser in headless mode and set up a page.
 *   const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: true })
 *   const page = await browser.newPage()
 *
 *   // Navigate to the page that will perform the tests.
 *   const testUrl = 'https://intoli.com/blog/' +
 *     'not-possible-to-block-chrome-headless/chrome-headless-test.html'
 *   await page.goto(testUrl)
 *
 *   // Save a screenshot of the results.
 *   const screenshotPath = '/tmp/headless-test-result.png'
 *   await page.screenshot({path: screenshotPath})
 *   console.log('have a look at the screenshot:', screenshotPath)
 *
 *   await browser.close()
 * })()
 *
 * @param {Object} [opts] - Options
 * @param {Set<string>} [opts.enabledEvasions] - Specify which evasions to use (by default all)
 *
 */
class StealthPlugin extends PuppeteerExtraPlugin {
  private _evasionPlugins: PuppeteerExtraPlugin[] = [];

  constructor(opts: PluginOptions = {}) {
    super(opts);
    // Instantiate enabled evasion plugins
    this._initializeEvasions();
  }

  private _initializeEvasions(): void {
    const enabledEvasions = this.opts.enabledEvasions as Set<string>;
    for (const evasionName of enabledEvasions) {
      const evasionFactory = EVASION_MODULES[evasionName];
      if (evasionFactory) {
        this._evasionPlugins.push(evasionFactory());
      }
    }
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
   * Get all evasion plugins (for internal use).
   * @private
   */
  get evasions(): PuppeteerExtraPlugin[] {
    return this._evasionPlugins;
  }

  /**
   * Proxy lifecycle methods to evasion plugins
   */
  override async beforeLaunch(options: LaunchOptions): Promise<void> {
    for (const evasion of this._evasionPlugins) {
      if (typeof evasion.beforeLaunch === 'function') {
        await evasion.beforeLaunch(options);
      }
    }
  }

  override async beforeConnect(options: ConnectOptions): Promise<void> {
    for (const evasion of this._evasionPlugins) {
      if (typeof evasion.beforeConnect === 'function') {
        await evasion.beforeConnect(options);
      }
    }
  }

  override async onPageCreated(page: Page): Promise<void> {
    for (const evasion of this._evasionPlugins) {
      if (typeof evasion.onPageCreated === 'function') {
        await evasion.onPageCreated(page);
      }
    }
  }

  /**
   * Get all available evasions.
   *
   * Please look into the [evasions directory](./evasions/) for an up to date list.
   *
   * @type {Set<string>} - A Set of all available evasions.
   *
   * @example
   * const pluginStealth = require('@zorilla/puppeteer-extra-plugin-stealth')()
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
   * // Remove specific evasion from enabled ones dynamically
   * const pluginStealth = require('@zorilla/puppeteer-extra-plugin-stealth')()
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
    const emitter = browser as unknown as EventEmitter;
    if (emitter?.setMaxListeners) {
      emitter.setMaxListeners(30);
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
