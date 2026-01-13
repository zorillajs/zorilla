const PLUGIN_NAME = 'user-preferences';

import { describe, expect, test, vi } from 'vitest';

import Plugin from '../src/index.js';

describe('Plugin', () => {
  test('is a function', () => {
    expect(typeof Plugin).toBe('function');
  });

  test('should have the basic class members', () => {
    const instance = Plugin();
    expect(instance.name).toBe(PLUGIN_NAME);
    expect(instance._isPuppeteerExtraPlugin).toBe(true);
  });

  test('should have the public child class members', () => {
    const instance = Plugin();
    const prototype = Object.getPrototypeOf(instance);
    const childClassMembers = Object.getOwnPropertyNames(prototype);

    expect(childClassMembers).toContain('constructor');
    expect(childClassMembers).toContain('name');
    expect(childClassMembers).toContain('defaults');
    expect(childClassMembers).toContain('requirements');
    expect(childClassMembers).toContain('dependencies');
    expect(childClassMembers).toContain('data');
    expect(childClassMembers).toContain('combinedPrefs');
    expect(childClassMembers).toContain('beforeLaunch');
  });

  test('should have requirements set correctly', () => {
    const instance = Plugin();
    const requirements = instance.requirements;

    expect(requirements.has('runLast')).toBe(true);
    expect(requirements.has('dataFromPlugins')).toBe(true);
    expect(requirements.size).toBe(2);
  });

  test('should have dependencies set correctly', () => {
    const instance = Plugin();
    const dependencies = instance.dependencies;

    expect(dependencies.has('user-data-dir')).toBe(true);
    expect(dependencies.size).toBe(1);
  });
});

describe('Plugin Options', () => {
  test('should use default options', () => {
    const instance = Plugin();
    const opts = instance.opts;

    expect(opts.userPrefs).toEqual({});
  });

  test('should accept custom options', () => {
    const customPrefs = {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    };
    const instance = Plugin({ userPrefs: customPrefs });
    const opts = instance.opts;

    expect(opts.userPrefs).toEqual(customPrefs);
  });

  test('should merge custom options with defaults', () => {
    const customPrefs = {
      profile: {
        default_content_setting_values: {
          notifications: 2,
        },
      },
    };
    const instance = Plugin({ userPrefs: customPrefs });
    const opts = instance.opts;

    expect(opts.userPrefs).toEqual(customPrefs);
  });
});

describe('Plugin Data', () => {
  test('should expose data with userDataDirFile', () => {
    const instance = Plugin();
    const data = instance.data;

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].name).toHaveProperty('userDataDirFile');
    expect(data[0].value).toHaveProperty('target', 'Profile');
    expect(data[0].value).toHaveProperty('file', 'Preferences');
    expect(data[0].value).toHaveProperty('contents');
  });

  test('should include userPrefs in the data contents', () => {
    const customPrefs = {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    };
    const instance = Plugin({ userPrefs: customPrefs });
    const data = instance.data;
    const contents = JSON.parse(data[0].value.contents);

    expect(contents).toEqual(customPrefs);
  });
});

describe('combinedPrefs', () => {
  test('should return userPrefs when no plugin data', () => {
    const customPrefs = {
      profile: {
        default_content_setting_values: {
          notifications: 2,
        },
      },
    };
    const instance = Plugin({ userPrefs: customPrefs });

    expect(instance.combinedPrefs).toEqual(customPrefs);
  });

  test('should merge userPrefs with plugin data', async () => {
    const customPrefs = {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    };
    const instance = Plugin({ userPrefs: customPrefs });

    // Mock getDataFromPlugins to simulate other plugins providing preferences
    instance.getDataFromPlugins = vi.fn().mockReturnValue([
      {
        value: {
          profile: {
            default_content_setting_values: {
              notifications: 2,
            },
          },
        },
      },
    ]);

    // Trigger beforeLaunch to populate _userPrefsFromPlugins
    await instance.beforeLaunch({});

    const combined = instance.combinedPrefs;

    expect(combined).toHaveProperty('webkit.webprefs.default_font_size', 22);
    expect(combined).toHaveProperty(
      'profile.default_content_setting_values.notifications',
      2
    );
  });

  test('should handle multiple plugins providing preferences', async () => {
    const customPrefs = {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    };
    const instance = Plugin({ userPrefs: customPrefs });

    instance.getDataFromPlugins = vi.fn().mockReturnValue([
      {
        value: {
          profile: {
            default_content_setting_values: {
              notifications: 2,
            },
          },
        },
      },
      {
        value: {
          profile: {
            default_content_setting_values: {
              geolocation: 2,
            },
          },
        },
      },
    ]);

    await instance.beforeLaunch({});

    const combined = instance.combinedPrefs;

    expect(combined).toHaveProperty('webkit.webprefs.default_font_size', 22);
    expect(combined).toHaveProperty(
      'profile.default_content_setting_values.notifications',
      2
    );
    expect(combined).toHaveProperty(
      'profile.default_content_setting_values.geolocation',
      2
    );
  });
});

describe('beforeLaunch', () => {
  test('should populate _userPrefsFromPlugins from plugin data', async () => {
    const instance = Plugin();

    const pluginPrefs = {
      profile: {
        default_content_setting_values: {
          notifications: 2,
        },
      },
    };

    instance.getDataFromPlugins = vi
      .fn()
      .mockReturnValue([{ value: pluginPrefs }]);

    await instance.beforeLaunch({});

    const userPrefsFromPlugins = (instance as any)._userPrefsFromPlugins;
    expect(userPrefsFromPlugins).toEqual(pluginPrefs);
  });

  test('should merge multiple plugin preferences', async () => {
    const instance = Plugin();

    instance.getDataFromPlugins = vi.fn().mockReturnValue([
      {
        value: {
          webkit: {
            webprefs: {
              default_font_size: 22,
            },
          },
        },
      },
      {
        value: {
          profile: {
            default_content_setting_values: {
              notifications: 2,
            },
          },
        },
      },
    ]);

    await instance.beforeLaunch({});

    const userPrefsFromPlugins = (instance as any)._userPrefsFromPlugins;
    expect(userPrefsFromPlugins).toHaveProperty(
      'webkit.webprefs.default_font_size',
      22
    );
    expect(userPrefsFromPlugins).toHaveProperty(
      'profile.default_content_setting_values.notifications',
      2
    );
  });

  test('should call getDataFromPlugins with correct parameter', async () => {
    const instance = Plugin();
    instance.getDataFromPlugins = vi.fn().mockReturnValue([]);

    await instance.beforeLaunch({});

    expect(instance.getDataFromPlugins).toHaveBeenCalledWith('userPreferences');
  });

  test('should handle empty plugin data', async () => {
    const instance = Plugin();
    instance.getDataFromPlugins = vi.fn().mockReturnValue([]);

    await expect(instance.beforeLaunch({})).resolves.not.toThrow();

    const userPrefsFromPlugins = (instance as any)._userPrefsFromPlugins;
    expect(userPrefsFromPlugins).toEqual({});
  });
});

describe('Integration', () => {
  test('should properly integrate user prefs and plugin prefs', async () => {
    const userPrefs = {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    };

    const pluginPrefs1 = {
      profile: {
        default_content_setting_values: {
          notifications: 2,
        },
      },
    };

    const pluginPrefs2 = {
      profile: {
        default_content_setting_values: {
          geolocation: 2,
        },
      },
    };

    const instance = Plugin({ userPrefs });

    instance.getDataFromPlugins = vi
      .fn()
      .mockReturnValue([{ value: pluginPrefs1 }, { value: pluginPrefs2 }]);

    await instance.beforeLaunch({});

    const data = instance.data;
    const contents = JSON.parse(data[0].value.contents);

    // Should contain user prefs
    expect(contents).toHaveProperty('webkit.webprefs.default_font_size', 22);
    // Should contain merged plugin prefs
    expect(contents).toHaveProperty(
      'profile.default_content_setting_values.notifications',
      2
    );
    expect(contents).toHaveProperty(
      'profile.default_content_setting_values.geolocation',
      2
    );
  });

  test('should properly format JSON in data contents', () => {
    const userPrefs = {
      webkit: {
        webprefs: {
          default_font_size: 22,
        },
      },
    };

    const instance = Plugin({ userPrefs });
    const data = instance.data;

    // Should be valid JSON
    expect(() => JSON.parse(data[0].value.contents)).not.toThrow();

    // Should be formatted with 2 spaces
    expect(data[0].value.contents).toContain('\n  ');
  });
});
