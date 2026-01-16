import { describe, expect, test } from 'vitest';
import Plugin from '../src/index.js';

const PLUGIN_NAME = 'font-size';

describe('Plugin instantiation and structure', () => {
  test('should be a function', () => {
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

    expect(childClassMembers.includes('constructor')).toBe(true);
    expect(childClassMembers.includes('name')).toBe(true);
    expect(childClassMembers.includes('defaults')).toBe(true);
    expect(childClassMembers.includes('requirements')).toBe(true);
    expect(childClassMembers.includes('dependencies')).toBe(true);
    expect(childClassMembers.includes('data')).toBe(true);
  });
});

describe('Default options', () => {
  test('should have opts with default values', () => {
    const instance = Plugin();
    expect(instance.opts.defaultFontSize).toBe(20);
  });

  test('should allow custom font size', () => {
    const instance = Plugin({ defaultFontSize: 18 });
    expect(instance.opts.defaultFontSize).toBe(18);
  });
});

describe('Plugin requirements', () => {
  test('should require launch and headful', () => {
    const instance = Plugin();
    const requirements = instance.requirements;
    expect(requirements.has('launch')).toBe(true);
    expect(requirements.has('headful')).toBe(true);
    expect(requirements.size).toBe(2);
  });
});

describe('Plugin dependencies', () => {
  test('should depend on user-preferences plugin', () => {
    const instance = Plugin();
    const dependencies = instance.dependencies;
    expect(
      dependencies.has('@zorilla/puppeteer-extra-plugin-user-preferences')
    ).toBe(true);
    expect(dependencies.size).toBe(1);
  });
});

describe('Plugin data', () => {
  test('should provide userPreferences data with default font size', () => {
    const instance = Plugin();
    const data = instance.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('userPreferences');
    expect(data[0].value.webkit.webprefs.default_font_size).toBe(20);
  });

  test('should provide userPreferences data with custom font size', () => {
    const instance = Plugin({ defaultFontSize: 24 });
    const data = instance.data;
    expect(data[0].value.webkit.webprefs.default_font_size).toBe(24);
  });

  test('should update when font size changes', () => {
    const instance = Plugin({ defaultFontSize: 16 });
    const initialData = instance.data;
    expect(initialData[0].value.webkit.webprefs.default_font_size).toBe(16);

    // Modify the opts
    instance.opts.defaultFontSize = 22;
    const updatedData = instance.data;
    expect(updatedData[0].value.webkit.webprefs.default_font_size).toBe(22);
  });
});
