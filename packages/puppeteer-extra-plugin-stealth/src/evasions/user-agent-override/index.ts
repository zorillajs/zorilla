import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { ConnectOptions, LaunchOptions, Page } from 'puppeteer';

interface PageWithClient extends Page {
  _client?: (() => CDPSession | undefined) | CDPSession;
}

interface CDPSession {
  send<T = unknown>(
    method: string,
    params?: Record<string, unknown>
  ): Promise<T>;
}

interface UserAgentBrand {
  brand: string;
  version: string;
}

interface UserAgentMetadata {
  brands: UserAgentBrand[];
  fullVersion: string;
  platform: string;
  platformVersion: string;
  architecture: string;
  model: string;
  mobile: boolean;
}

interface UserAgentOverride {
  userAgent: string;
  platform: string;
  userAgentMetadata: UserAgentMetadata;
  acceptLanguage?: string;
}

/**
 * Fixes the UserAgent info (composed of UA string, Accept-Language, Platform, and UA hints).
 *
 * If you don't provide any values this plugin will default to using the regular UserAgent string (while stripping the headless part).
 * Default language is set to "en-US,en", the other settings match the UserAgent string.
 * If you are running on Linux, it will mask the settins to look like Windows. This behavior can be disabled with the `maskLinux` option.
 *
 * By default puppeteer will not set a `Accept-Language` header in headless:
 * It's (theoretically) possible to fix that using either `page.setExtraHTTPHeaders` or a `--lang` launch arg.
 * Unfortunately `page.setExtraHTTPHeaders` will lowercase everything and launch args are not always available. :)
 *
 * In addition, the `navigator.platform` property is always set to the host value, e.g. `Linux` which makes detection very easy.
 *
 * Note: You cannot use the regular `page.setUserAgent()` puppeteer call in your code,
 * as it will reset the language and platform values you set with this plugin.
 *
 * @example
 * const puppeteer = require("puppeteer-extra")
 *
 * const StealthPlugin = require("puppeteer-extra-plugin-stealth")
 * const stealth = StealthPlugin()
 * // Remove this specific stealth plugin from the default set
 * stealth.enabledEvasions.delete("user-agent-override")
 * puppeteer.use(stealth)
 *
 * // Stealth plugins are just regular `puppeteer-extra` plugins and can be added as such
 * const UserAgentOverride = require("puppeteer-extra-plugin-stealth/evasions/user-agent-override")
 * // Define custom UA and locale
 * const ua = UserAgentOverride({ userAgent: "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1)", locale: "de-DE,de" })
 * puppeteer.use(ua)
 *
 * @param {Object} [opts] - Options
 * @param {string} [opts.userAgent] - The user agent to use (default: browser.userAgent())
 * @param {string} [opts.locale] - The locale to use in `Accept-Language` header and in `navigator.languages` (default: `en-US,en`)
 * @param {boolean} [opts.maskLinux] - Wether to hide Linux as platform in the user agent or not - true by default
 *
 */
class Plugin extends PuppeteerExtraPlugin {
  private _headless = false;

  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/user-agent-override';
  }

  override get dependencies(): Set<string> {
    return new Set(['user-preferences']);
  }

  override get defaults(): Record<string, unknown> {
    return {
      userAgent: null,
      locale: 'en-US,en',
      maskLinux: true,
    };
  }

  override async onPageCreated(page: Page): Promise<void> {
    // Determine the full user agent string, strip the "Headless" part
    let ua =
      (this.opts.userAgent as string) ||
      (await page.browser().userAgent()).replace('HeadlessChrome/', 'Chrome/');

    if (
      this.opts.maskLinux &&
      ua.includes('Linux') &&
      !ua.includes('Android') // Skip Android user agents since they also contain Linux
    ) {
      ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)'); // Replace the first part in parentheses with Windows data
    }

    // Full version number from Chrome
    const uaVersion = ua.includes('Chrome/')
      ? ua.match(/Chrome\/([\d|.]+)/)![1]!
      : (await page.browser().version()).match(/\/([\d|.]+)/)![1]!;

    // Get platform identifier (short or long version)
    const _getPlatform = (extended = false): string => {
      if (ua.includes('Mac OS X')) {
        return extended ? 'Mac OS X' : 'MacIntel';
      } else if (ua.includes('Android')) {
        return 'Android';
      } else if (ua.includes('Linux')) {
        return 'Linux';
      } else {
        return extended ? 'Windows' : 'Win32';
      }
    };

    // Source in C++: https://source.chromium.org/chromium/chromium/src/+/master:components/embedder_support/user_agent_utils.cc;l=55-100
    const _getBrands = (): UserAgentBrand[] => {
      const seed = uaVersion.split('.')[0]!; // the major version number of Chrome (as string for CDP)

      const orderOptions = [
        [0, 1, 2],
        [0, 2, 1],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
      ];
      const order = orderOptions[Number.parseInt(seed, 10) % 6] as [
        number,
        number,
        number,
      ];
      const escapedChars = [' ', ' ', ';'];

      const greaseyBrand = `${escapedChars[order[0]]}Not${
        escapedChars[order[1]]
      }A${escapedChars[order[2]]}Brand`;

      const greasedBrandVersionList: UserAgentBrand[] = [];
      greasedBrandVersionList[order[0]] = {
        brand: greaseyBrand,
        version: '99',
      };
      greasedBrandVersionList[order[1]] = {
        brand: 'Chromium',
        version: seed,
      };
      greasedBrandVersionList[order[2]] = {
        brand: 'Google Chrome',
        version: seed,
      };

      return greasedBrandVersionList;
    };

    // Return OS version
    const _getPlatformVersion = (): string => {
      if (ua.includes('Mac OS X ')) {
        const match = ua.match(/Mac OS X ([^)]+)/);
        return match?.[1] || '';
      } else if (ua.includes('Android ')) {
        const match = ua.match(/Android ([^;]+)/);
        return match?.[1] || '';
      } else if (ua.includes('Windows ')) {
        const match = ua.match(/Windows .*?([\d|.]+);?/);
        return match?.[1] || '';
      } else {
        return '';
      }
    };

    // Get architecture, this seems to be empty on mobile and x86 on desktop
    const _getPlatformArch = (): string => (_getMobile() ? '' : 'x86');

    // Return the Android model, empty on desktop
    const _getPlatformModel = (): string => {
      if (!_getMobile()) return '';
      const match = ua.match(/Android.*?;\s([^)]+)/);
      return match?.[1] || '';
    };

    const _getMobile = (): boolean => ua.includes('Android');

    const override: UserAgentOverride = {
      userAgent: ua,
      platform: _getPlatform(),
      userAgentMetadata: {
        brands: _getBrands(),
        fullVersion: uaVersion,
        platform: _getPlatform(true),
        platformVersion: _getPlatformVersion(),
        architecture: _getPlatformArch(),
        model: _getPlatformModel(),
        mobile: _getMobile(),
      },
    };

    // In case of headless, override the acceptLanguage in CDP.
    // This is not preferred, as it messed up the header order.
    // On headful, we set the user preference language setting instead.
    if (this._headless) {
      override.acceptLanguage = (this.opts.locale as string) || 'en-US,en';
    }

    this.debug('onPageCreated - Will set these user agent options', {
      override,
      opts: this.opts,
    });

    const pageWithClient = page as PageWithClient;
    const client =
      typeof pageWithClient._client === 'function'
        ? pageWithClient._client()
        : pageWithClient._client;
    // Type assertion needed because CDP send expects Record<string, unknown> but our typed interface doesn't have index signature
    // biome-ignore lint/suspicious/noExplicitAny: CDP protocol requires dynamic parameters
    client!.send('Network.setUserAgentOverride', override as any);
  }

  override async beforeLaunch(options: LaunchOptions): Promise<void> {
    // Check if launched headless
    this._headless = !!options.headless;
  }

  override async beforeConnect(_options?: ConnectOptions): Promise<void> {
    // Treat browsers using connect() as headless browsers
    this._headless = true;
  }

  override get data() {
    return [
      {
        name: 'userPreferences' as unknown as { [key: string]: unknown },
        value: {
          intl: {
            accept_languages: (this.opts.locale as string) || 'en-US,en',
          },
        },
      },
    ];
  }
}

export default function (opts?: Record<string, unknown>): Plugin {
  return new Plugin(opts);
}
