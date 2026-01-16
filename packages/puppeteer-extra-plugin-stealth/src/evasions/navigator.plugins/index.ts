import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import type { Page } from '@zorilla/puppeteer-extra-plugin/dist/puppeteer';
import utils from '../_utils/index.js';
import withUtils from '../_utils/withUtils.js';
import data from './data.json';
import { generateFunctionMocks } from './functionMocks.js';
import { generateMagicArray } from './magicArray.js';
import { generateMimeTypeArray } from './mimeTypes.js';
import { generatePluginArray } from './plugins.js';

interface PluginData {
  name: string;
  __mimeTypes: string[];
  [key: string]: unknown;
}

interface MimeTypeData {
  type: string;
  [key: string]: unknown;
}

interface Data {
  mimeTypes: MimeTypeData[];
  plugins: PluginData[];
}

/**
 * In headless mode `navigator.mimeTypes` and `navigator.plugins` are empty.
 * This plugin emulates both of these with functional mocks to match regular headful Chrome.
 *
 * Note: mimeTypes and plugins cross-reference each other, so it makes sense to do them at the same time.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/mimeTypes
 * @see https://developer.mozilla.org/en-US/docs/Web/API/MimeTypeArray
 * @see https://developer.mozilla.org/en-US/docs/Web/API/NavigatorPlugins/plugins
 * @see https://developer.mozilla.org/en-US/docs/Web/API/PluginArray
 */
class Plugin extends PuppeteerExtraPlugin {
  constructor(opts: Record<string, unknown> = {}) {
    super(opts);
  }

  override get name(): string {
    return 'stealth/evasions/navigator.plugins';
  }

  override async onPageCreated(page: Page): Promise<void> {
    await withUtils(page).evaluateOnNewDocument(
      (utils, { fns, data }: { fns: Record<string, string>; data: Data }) => {
        const materializedFns = utils.materializeFns(fns);

        // That means we're running headful
        const hasPlugins = 'plugins' in navigator && navigator.plugins.length;
        if (hasPlugins) {
          return; // nothing to do here
        }

        const mimeTypes = materializedFns.generateMimeTypeArray!(
          utils,
          materializedFns
        )(data.mimeTypes);
        const plugins = materializedFns.generatePluginArray!(
          utils,
          materializedFns
        )(data.plugins);

        // Plugin and MimeType cross-reference each other, let's do that now
        // Note: We're looping through `data.plugins` here, not the generated `plugins`
        for (const pluginData of data.plugins) {
          pluginData.__mimeTypes.forEach((type: string, index: number) => {
            plugins[pluginData.name][index] = mimeTypes[type];

            Object.defineProperty(plugins[pluginData.name], type, {
              value: mimeTypes[type],
              writable: false,
              enumerable: false, // Not enumerable
              configurable: true,
            });
            Object.defineProperty(mimeTypes[type], 'enabledPlugin', {
              value:
                type === 'application/x-pnacl'
                  ? mimeTypes['application/x-nacl'].enabledPlugin // these reference the same plugin, so we need to re-use the Proxy in order to avoid leaks
                  : new Proxy(plugins[pluginData.name], {}), // Prevent circular references
              writable: false,
              enumerable: false, // Important: `JSON.stringify(navigator.plugins)`
              configurable: true,
            });
          });
        }

        const patchNavigator = (name: string, value: unknown) =>
          utils.replaceProperty(Object.getPrototypeOf(navigator), name, {
            get() {
              return value;
            },
          });

        patchNavigator('mimeTypes', mimeTypes);
        patchNavigator('plugins', plugins);

        // All done
      },
      {
        // We pass some functions to evaluate to structure the code more nicely
        fns: utils.stringifyFns({
          generateMimeTypeArray: generateMimeTypeArray as unknown as Function,
          generatePluginArray: generatePluginArray as unknown as Function,
          generateMagicArray: generateMagicArray as unknown as Function,
          generateFunctionMocks: generateFunctionMocks as unknown as Function,
        }),
        data,
      }
    );
  }
}

export default function (pluginConfig?: Record<string, unknown>): Plugin {
  return new Plugin(pluginConfig);
}
