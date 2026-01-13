import {
  type PluginData,
  type PluginDependencies,
  type PluginRequirements,
  PuppeteerExtraPlugin,
} from '@zorilla/puppeteer-extra-plugin';
import merge from 'deepmerge';

/**
 * Represents a deeply nested preference value structure.
 * Chrome preferences can be primitives or nested objects.
 */
type PreferenceValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: PreferenceValue };

interface PluginOptions {
  userPrefs?: Record<string, PreferenceValue>;
  [key: string]: unknown;
}

/**
 * Launch puppeteer with arbitrary user preferences.
 *
 * The user defined preferences will be merged with preferences set by other plugins.
 * Plugins can add user preferences by exposing a data entry with the name `userPreferences`.
 *
 * Overview:
 * https://source.chromium.org/chromium/chromium/src/+/main:chrome/common/pref_names.cc
 *
 * @param {Object} opts - Options
 * @param {Object} [opts.userPrefs={}] - An object containing the preferences.
 *
 * @example
 * import puppeteer from '@zorilla/puppeteer-extra'
 * import userPreferencesPlugin from '@zorilla/puppeteer-extra-plugin-user-preferences'
 * puppeteer.use(userPreferencesPlugin({userPrefs: {
 *   webkit: {
 *     webprefs: {
 *       default_font_size: 22
 *     }
 *   }
 * }}))
 * const browser = await puppeteer.launch()
 */
class Plugin extends PuppeteerExtraPlugin {
  private _userPrefsFromPlugins: Record<string, PreferenceValue> = {};

  constructor(opts: PluginOptions = {}) {
    super(opts);
  }

  override get name(): string {
    return 'user-preferences';
  }

  override get defaults(): Required<PluginOptions> {
    return {
      userPrefs: {},
    };
  }

  override get requirements(): PluginRequirements {
    return new Set(['runLast', 'dataFromPlugins']);
  }

  override get dependencies(): PluginDependencies {
    return new Set(['user-data-dir']);
  }

  override get data(): PluginData[] {
    return [
      {
        name: {
          userDataDirFile: true,
        },
        value: {
          target: 'Profile',
          file: 'Preferences',
          contents: JSON.stringify(this.combinedPrefs, null, 2),
        },
      },
    ];
  }

  get combinedPrefs(): Record<string, PreferenceValue> {
    const opts = this.opts as Required<PluginOptions>;
    return merge(opts.userPrefs, this._userPrefsFromPlugins);
  }

  override async beforeLaunch(_options: unknown): Promise<void> {
    this._userPrefsFromPlugins = merge.all(
      this.getDataFromPlugins('userPreferences').map(
        d => d.value as Record<string, PreferenceValue>
      )
    ) as Record<string, PreferenceValue>;
    this.debug('_userPrefsFromPlugins', this._userPrefsFromPlugins);
  }
}

export default function (pluginConfig?: PluginOptions): Plugin {
  return new Plugin(pluginConfig);
}
