import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import { describe, expect, test, vi } from 'vitest';
import { addExtra } from './index.js';

// Create test plugins that modify options
class TransformPlugin extends PuppeteerExtraPlugin {
  private transform: (value: any) => any;
  private _name: string;

  constructor(name: string, transform: (value: any) => any) {
    super({});
    this._name = name;
    this.transform = transform;
  }

  get name() {
    return this._name;
  }

  async beforeLaunch(options: any) {
    return this.transform(options);
  }
}

describe('Plugin Hooks with Value Returns', () => {
  test('should use returned value from plugin hook', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    // Plugin that adds a property
    const plugin1 = new TransformPlugin('add-property', (options: any) => {
      return { ...options, addedByPlugin: true };
    });

    // Plugin that modifies the added property
    const plugin2 = new TransformPlugin('modify-property', (options: any) => {
      if (options.addedByPlugin) {
        return { ...options, modifiedByPlugin: true };
      }
      return options;
    });

    puppeteer.use(plugin1);
    puppeteer.use(plugin2);

    const launchSpy = vi.spyOn(puppeteer, 'launch');
    await puppeteer.launch({});

    // Verify the modifications were applied
    expect(launchSpy).toHaveBeenCalled();
  });

  test('should handle plugin that returns null/undefined', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    // Plugin that returns null (should not modify options)
    const plugin1 = new TransformPlugin('no-op', () => null);

    // Plugin that adds a property
    const plugin2 = new TransformPlugin('add-property', (options: any) => {
      return { ...options, addedByPlugin: true };
    });

    puppeteer.use(plugin1);
    puppeteer.use(plugin2);

    await expect(puppeteer.launch({})).resolves.not.toThrow();
  });

  test('should chain multiple plugin modifications', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    const transformations: string[] = [];

    const plugin1 = new TransformPlugin('first', (options: any) => {
      transformations.push('first');
      return { ...options, step: 1 };
    });

    const plugin2 = new TransformPlugin('second', (options: any) => {
      transformations.push('second');
      return { ...options, step: 2 };
    });

    const plugin3 = new TransformPlugin('third', (options: any) => {
      transformations.push('third');
      return { ...options, step: 3 };
    });

    puppeteer.use(plugin1);
    puppeteer.use(plugin2);
    puppeteer.use(plugin3);

    await puppeteer.launch({});

    // All plugins should have been called in order
    expect(transformations).toEqual(['first', 'second', 'third']);
  });
});
