import { describe, expect, it } from 'vitest';

import { addExtra } from './index';

describe('addExtra', () => {
  it('is a function', async () => {
    expect(typeof addExtra).toBe('function');
  });

  it('is an instance of Function', async () => {
    expect(addExtra.constructor.name).toBe('Function');
  });

  it('returns an object', async () => {
    expect(typeof addExtra(null as any)).toBe('object');
  });

  it('returns an instance of PuppeteerExtra', async () => {
    expect(addExtra(null as any).constructor.name).toBe('PuppeteerExtra');
  });

  it('will throw without puppeteer', async () => {
    const pptr = addExtra(null as any);
    expect(() => pptr.pptr).toThrow('No puppeteer instance provided.');
  });
});
