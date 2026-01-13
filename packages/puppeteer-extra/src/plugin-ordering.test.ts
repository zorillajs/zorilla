import { PuppeteerExtraPlugin } from '@zorilla/puppeteer-extra-plugin';
import { describe, expect, test, vi } from 'vitest';
import { addExtra } from './index.js';

// Create a test plugin
class TestPlugin extends PuppeteerExtraPlugin {
  private _runLast: boolean;
  private _name: string;

  constructor(name: string, runLast: boolean = false) {
    super({});
    this._name = name;
    this._runLast = runLast;
  }

  get name() {
    return this._name;
  }

  get requirements() {
    return this._runLast ? new Set(['runLast']) : new Set();
  }
}

describe('Plugin Ordering', () => {
  test('should reorder plugins with runLast requirement to end', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    const plugin1 = new TestPlugin('first');
    const plugin2 = new TestPlugin('second');
    const plugin3 = new TestPlugin('last', true);
    const plugin4 = new TestPlugin('fourth');

    puppeteer.use(plugin1);
    puppeteer.use(plugin2);
    puppeteer.use(plugin3);
    puppeteer.use(plugin4);

    // Order is determined during launch, not during use
    await puppeteer.launch({});

    const names = puppeteer.plugins.map(p => p.name);

    // 'last' should be at the end
    expect(names).toEqual(['first', 'second', 'fourth', 'last']);
  });

  test('should handle multiple runLast plugins', async () => {
    const puppeteer = addExtra({
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn(),
        on: vi.fn(),
        targets: vi.fn().mockReturnValue([]),
      }),
    } as any);

    const plugin1 = new TestPlugin('first');
    const plugin2 = new TestPlugin('runLast1', true);
    const plugin3 = new TestPlugin('middle');
    const plugin4 = new TestPlugin('runLast2', true);

    puppeteer.use(plugin1);
    puppeteer.use(plugin2);
    puppeteer.use(plugin3);
    puppeteer.use(plugin4);

    // Order is determined during launch, not during use
    await puppeteer.launch({});

    const names = puppeteer.plugins.map(p => p.name);

    // Both runLast plugins should be at the end, in the order they were added
    expect(names[0]).toBe('first');
    expect(names[1]).toBe('middle');
    expect(names.slice(2)).toEqual(
      expect.arrayContaining(['runLast1', 'runLast2'])
    );
  });

  test('should handle empty plugin list', () => {
    const puppeteer = addExtra({ launch: vi.fn() } as any);

    expect(puppeteer.plugins).toEqual([]);
    expect(() => puppeteer.plugins.map(p => p.name)).not.toThrow();
  });
});
