import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';

interface PluginOptions {
  allowFlash?: boolean;
  pluginPath?: string | null;
  pluginVersion?: number;
  [key: string]: unknown;
}

/**
 * Allow flash on all sites without user interaction.
 *
 * Note: The flash plugin is not working in headless mode.
 *
 * Note: When using the default Chromium browser
 * `pluginPath` and `pluginVersion` must be specified.
 *
 * Note: Unfortunately this doesn't seem to enable flash on incognito pages,
 * see [this gist] for a workaround using management policies.
 * [this gist]: https://gist.github.com/berstend/bcd64a4a2db28afbd6486daf69f4e787
 *
 * @param {Object} opts - Options
 * @param {boolean} [opts.allowFlash=true] - Whether to allow flash content or not
 * @param {boolean} [opts.pluginPath=null] - Flash plugin path
 * @param {boolean} [opts.pluginVersion=9000] - Flash plugin version (9000 is high enough for Chrome not to complain)
 *
 * @example
 * import puppeteer from '@zorilla/puppeteer-extra'
 * import flashPlugin from '@zorilla/puppeteer-extra-plugin-flash'
 * puppeteer.use(flashPlugin())
 * ;(async () => {
 *   const browser = await puppeteer.launch({headless: false})
 *   const page = await browser.newPage()
 *   await page.goto('http://ultrasounds.com', {waitUntil: 'domcontentloaded'})
 * })()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'flash';
  }

  override get defaults(): PluginOptions {
    return {
      allowFlash: true,
      pluginPath: null,
      pluginVersion: 9000,
    };
  }

  override get requirements() {
    return new Set<'launch' | 'headful'>(['launch', 'headful']);
  }

  override get dependencies() {
    return new Set(['@zorilla/puppeteer-extra-plugin-user-preferences']);
  }

  override async beforeLaunch(options: { args?: string[] }): Promise<void> {
    if (this.opts.allowFlash === false) {
      return;
    }

    if (this.opts.pluginPath) {
      options.args!.push(`--ppapi-flash-path=${this.opts.pluginPath}`);
    }
    if (this.opts.pluginVersion) {
      options.args!.push(`--ppapi-flash-version=${this.opts.pluginVersion}`);
    }
  }

  override get data() {
    if (this.opts.allowFlash === false) {
      return [];
    }
    const allowFlashPreferences = {
      profile: {
        managed_default_content_settings: {
          plugins: 1,
        },
        managed_plugins_allowed_for_urls: ['https://*', 'http://*'],
      },
    };
    return [
      {
        name: 'userPreferences',
        value: allowFlashPreferences,
      },
    ];
  }
}

export default function (pluginConfig?: PluginOptions): Plugin {
  return new Plugin(pluginConfig);
}
