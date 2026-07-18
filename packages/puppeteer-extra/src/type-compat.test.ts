import puppeteer from 'puppeteer';
import { describe, expect, expectTypeOf, test } from 'vitest';
import { addExtra, type PuppeteerExtraPlugin } from './index.js';

declare class ExternalPuppeteerExtraPlugin {
  private _debugBase;
  private _opts;
  private _childClassMembers;

  _isPuppeteerExtraPlugin: boolean;
  name: string;
  requirements: Set<string>;
  data: unknown;
  _register(prototype: object): void;
  _getMissingDependencies(plugins: ExternalPuppeteerExtraPlugin[]): Set<string>;
}

type AssertAssignable<T extends PuppeteerExtraPlugin> = T;
type _ExternalPluginIsAccepted = AssertAssignable<ExternalPuppeteerExtraPlugin>;

describe('type compatibility', () => {
  test('accepts plugins typed from a separate base package instance', () => {
    expect(true).toBe(true);
  });

  test('accepts current Puppeteer versions without createBrowserFetcher', () => {
    const extra = addExtra(puppeteer);

    expectTypeOf(extra).toMatchTypeOf<ReturnType<typeof addExtra>>();
    expect(extra.pptr).toBe(puppeteer);
  });
});
