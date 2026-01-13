import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import { describe, expect, test, vi } from 'vitest';
import { addExtra } from './index.js';

// Create a test plugin with requirements
class TestPlugin extends PuppeteerExtraPlugin {
  private _requirements: Set<string>;
  private _name: string;

  constructor(name: string, requirements: string[] = []) {
    super({});
    this._name = name;
    this._requirements = new Set(requirements);
  }

  get name() {
    return this._name;
  }

  get requirements() {
    return this._requirements;
  }
}

describe('Plugin Requirements', () => {
  test('should warn when headful plugin used in headless mode', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Add a plugin that requires headful
    const headfulPlugin = new TestPlugin('headful-plugin', ['headful']);
    puppeteer.use(headfulPlugin);

    // Launch in headless mode
    await puppeteer.launch({ headless: true });

    // Should have warned
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Plugin 'headful-plugin' is not supported in headless mode"
      )
    );

    warnSpy.mockRestore();
  });

  test('should warn when launch-only plugin used with connect', async () => {
    const puppeteer = addExtra({
      connect: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Add a plugin that requires launch
    const launchPlugin = new TestPlugin('launch-plugin', ['launch']);
    puppeteer.use(launchPlugin);

    // Use connect instead
    await puppeteer.connect({ browserWSEndpoint: 'ws://localhost' } as any);

    // Should have warned
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Plugin 'launch-plugin' doesn't support puppeteer.connect()"
      )
    );

    warnSpy.mockRestore();
  });

  test('should not warn when no conflicting requirements', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Add a plugin with no special requirements
    const normalPlugin = new TestPlugin('normal-plugin', []);
    puppeteer.use(normalPlugin);

    await puppeteer.launch({ headless: true });

    // Should not have warned
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
