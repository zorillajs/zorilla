import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';

interface PluginOptions {
  defaultFontSize?: number;
  [key: string]: unknown;
}

/**
 * Modify/increase the default font size in puppeteer.
 *
 * @param {Object} opts - Options
 * @param {Number} [opts.defaultFontSize=20] - Default browser font size
 *
 * @example
 * import puppeteer from '@zorilla/puppeteer-extra'
 * import fontSizePlugin from '@zorilla/puppeteer-extra-plugin-font-size'
 * puppeteer.use(fontSizePlugin())
 * // or
 * puppeteer.use(fontSizePlugin({defaultFontSize: 18}))
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'font-size';
  }

  override get defaults(): PluginOptions {
    return { defaultFontSize: 20 };
  }

  override get requirements() {
    return new Set<'launch' | 'headful'>(['launch', 'headful']);
  }

  override get dependencies() {
    return new Set(['@zorilla/puppeteer-extra-plugin-user-preferences']);
  }

  override get data() {
    const userPreferences = {
      webkit: {
        webprefs: {
          default_font_size: this.opts.defaultFontSize,
        },
      },
    };
    return [
      {
        name: 'userPreferences',
        value: userPreferences,
      },
    ];
  }
}

export default function (pluginConfig?: PluginOptions): Plugin {
  return new Plugin(pluginConfig);
}
