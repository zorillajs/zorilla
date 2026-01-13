// Playwrights test runner is great, originally based on folio (which unfortunately isn't maintained anymore): https://github.com/microsoft/folio

import type * as pwTest from '@playwright/test';
import { test as base } from '@playwright/test';
import * as pwVanillaModule from 'playwright-core';
import * as pwExtraModule from '../../src/index.js';

type PluginModuleWithOptions = {
  module: (opts?: Record<string, unknown>) => unknown;
  opts?: Record<string, unknown>;
};

export type ExtraOptions = {};

export type ExtraFixtures = {
  /** playwright-extra module */
  playwrightExtra: typeof pwExtraModule;
  /** playwright-core module */
  playwrightVanilla: typeof pwVanillaModule;
  /** Augmented launcher */
  extraLauncher: pwExtraModule.AugmentedBrowserLauncher;
};

type WorkerFixtures = {
  plugins: PluginModuleWithOptions[];
};

export const worker = base.extend<{}, WorkerFixtures>({
  plugins: [[], { option: true, scope: 'worker' }],

  browser: async ({ playwright, browserName, plugins }, use) => {
    if (!['chromium', 'firefox', 'webkit'].includes(browserName))
      throw new Error(
        `Unexpected browserName "${browserName}", must be one of "chromium", "firefox" or "webkit"`
      );
    const launcher = pwExtraModule.addExtra(playwright[browserName]);

    plugins.forEach(({ module: pluginModule, opts }) => {
      launcher.use(pluginModule(opts));
    });

    const browser = await launcher.launch();
    const browserWithLauncher: pwTest.Browser & { _launcher: unknown } =
      Object.assign(browser, { _launcher: launcher });
    await use(browserWithLauncher);
    await browser.close();
  },
});

// Extend base test by providing "todoPage" and "settingsPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = worker.extend<ExtraOptions & ExtraFixtures>({
  extraLauncher: async (
    { plugins, playwrightExtra, playwrightVanilla, browserName },
    use
  ) => {
    const launcher = playwrightExtra.addExtra(playwrightVanilla[browserName]);
    plugins.forEach(({ module: pluginModule, opts }) => {
      launcher.use(pluginModule(opts));
    });
    await use(launcher);
  },
  playwrightExtra: async (
    // biome-ignore lint/correctness/noEmptyPattern: No dependencies needed
    {},
    use
  ) => {
    await use(pwExtraModule);
  },
  playwrightVanilla: async (
    // biome-ignore lint/correctness/noEmptyPattern: No dependencies needed
    {},
    use
  ) => {
    await use(pwVanillaModule);
  },
});

export { expect } from '@playwright/test';
