import { expect, test, vi } from 'vitest';

import { PuppeteerExtraPlugin } from '.';

test('is a function', async () => {
  expect(typeof PuppeteerExtraPlugin).toBe('function');
});

test('will throw without a name', async () => {
  class Derived extends PuppeteerExtraPlugin {}
  expect(() => new Derived()).toThrow(`Plugin must override "name"`);
});

test('should have the basic class members', async () => {
  const pluginName = 'hello-world';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
  }
  const instance = new Plugin();

  expect(instance.name).toBe(pluginName);
  expect(instance.requirements instanceof Set).toBe(true);
  expect(instance.dependencies instanceof Set).toBe(true);
  expect(Array.isArray(instance.data)).toBe(true);
  expect(instance.defaults instanceof Object).toBe(true);
  expect(instance.data.length).toBe(0);
  expect(instance.debug instanceof Function).toBe(true);
  expect(instance.debug.namespace).toBe(`puppeteer-extra-plugin:${pluginName}`);
  expect(instance._isPuppeteerExtraPlugin).toBe(true);
});

test('should have the public class members', async () => {
  const pluginName = 'hello-world';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
  }
  const instance = new Plugin();

  expect(instance.beforeLaunch instanceof Function).toBe(true);
  expect(instance.afterLaunch instanceof Function).toBe(true);
  expect(instance.onTargetCreated instanceof Function).toBe(true);
  expect(instance.onBrowser instanceof Function).toBe(true);
  expect(instance.onPageCreated instanceof Function).toBe(true);
  expect(instance.onTargetChanged instanceof Function).toBe(true);
  expect(instance.onTargetDestroyed instanceof Function).toBe(true);
  expect(instance.onDisconnected instanceof Function).toBe(true);
  expect(instance.onClose instanceof Function).toBe(true);
  expect(instance.onPluginRegistered instanceof Function).toBe(true);
  expect(instance.getDataFromPlugins instanceof Function).toBe(true);
});

test('should have the internal class members', async () => {
  const pluginName = 'hello-world';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
  }
  const instance = new Plugin();

  expect(instance._getMissingDependencies instanceof Function).toBe(true);
  expect(instance._dependencyBaseUrl).toMatch(/^file:\/\//);
  expect(instance._bindBrowserEvents instanceof Function).toBe(true);
  expect(instance._onTargetCreated instanceof Function).toBe(true);
  expect(instance._register instanceof Function).toBe(true);
  expect(instance._registerChildClassMembers instanceof Function).toBe(true);
  expect(instance._hasChildClassMember instanceof Function).toBe(true);
});

test('should merge opts with defaults automatically', async () => {
  const pluginName = 'hello-world';
  const pluginDefaults = { foo: 'bar', foo2: 'bar2', extra1: 123 };
  const userOpts = { foo2: 'bob', extra2: 666 };

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override get defaults() {
      return pluginDefaults;
    }
  }
  const instance = new Plugin(userOpts);

  expect(instance.defaults).toEqual(pluginDefaults);
  expect(instance.opts.foo).toBe(pluginDefaults.foo);
  expect(instance.opts.foo2).toBe(userOpts.foo2);
  expect(instance.opts.extra1).toBe(pluginDefaults.extra1);
  expect(instance.opts.extra2).toBe(userOpts.extra2);
});

test('should have opts when defaults is not defined', async () => {
  const pluginName = 'hello-world';
  const userOpts = { foo2: 'bob', extra2: 666 };

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
  }
  const instance = new Plugin(userOpts);

  expect(instance.opts).toEqual(userOpts);
});

test('getDataFromPlugins returns empty array by default', async () => {
  const pluginName = 'test-plugin';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
  }
  const instance = new Plugin();

  const data = instance.getDataFromPlugins('some-plugin');
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBe(0);
});

test('_getMissingDependencies identifies missing plugin dependencies', async () => {
  const pluginName = 'test-plugin';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override get dependencies() {
      return new Set(['plugin-a', 'plugin-b', 'plugin-c']);
    }
  }
  const instance = new Plugin();

  const registeredPlugins = [{ name: 'plugin-a' }, { name: 'plugin-b' }];

  const missing = instance._getMissingDependencies(registeredPlugins);
  expect(missing instanceof Set).toBe(true);
  expect(missing.has('plugin-c')).toBe(true);
  expect(missing.has('plugin-a')).toBe(false);
  expect(missing.has('plugin-b')).toBe(false);
  expect(missing.size).toBe(1);
});

test('_register calls child class registration methods', async () => {
  const pluginName = 'test-plugin';
  let onPluginRegisteredCalled = false;

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override onPluginRegistered() {
      onPluginRegisteredCalled = true;
    }
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);

  instance._register(prototype);

  expect(onPluginRegisteredCalled).toBe(true);
  expect((instance as any)._childClassMembers).toContain('onPluginRegistered');
});

test('_registerChildClassMembers stores class member names', async () => {
  const pluginName = 'test-plugin';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    customMethod() {}
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);

  instance._registerChildClassMembers(prototype);

  expect((instance as any)._childClassMembers.includes('customMethod')).toBe(
    true
  );
});

test('_hasChildClassMember checks if member exists', async () => {
  const pluginName = 'test-plugin';
  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override onPageCreated() {}
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);
  instance._registerChildClassMembers(prototype);

  expect(instance._hasChildClassMember('onPageCreated')).toBe(true);
  expect(instance._hasChildClassMember('nonExistentMethod')).toBe(false);
});

test('_bindBrowserEvents registers event handlers', async () => {
  const pluginName = 'test-plugin';
  let _onTargetCreatedCalled = false;
  let onBrowserCalled = false;

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override onTargetCreated() {
      _onTargetCreatedCalled = true;
    }
    override async onBrowser() {
      onBrowserCalled = true;
    }
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);
  instance._registerChildClassMembers(prototype);

  const mockBrowser = {
    on: vi.fn(),
  };

  await instance._bindBrowserEvents(mockBrowser as any, {});

  expect(mockBrowser.on).toHaveBeenCalledWith(
    'targetcreated',
    expect.any(Function)
  );
  expect(onBrowserCalled).toBe(true);
});

test('_bindBrowserEvents calls afterLaunch for launch context', async () => {
  const pluginName = 'test-plugin';
  let afterLaunchCalled = false;

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override async afterLaunch() {
      afterLaunchCalled = true;
    }
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);
  instance._registerChildClassMembers(prototype);

  const mockBrowser = { on: vi.fn() };

  await instance._bindBrowserEvents(mockBrowser as any, {
    context: 'launch',
    options: {},
  });

  expect(afterLaunchCalled).toBe(true);
});

test('_bindBrowserEvents calls afterConnect for connect context', async () => {
  const pluginName = 'test-plugin';
  let afterConnectCalled = false;

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override async afterConnect() {
      afterConnectCalled = true;
    }
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);
  instance._registerChildClassMembers(prototype);

  const mockBrowser = { on: vi.fn() };

  await instance._bindBrowserEvents(mockBrowser as any, {
    context: 'connect',
    options: {},
  });

  expect(afterConnectCalled).toBe(true);
});

test('_onTargetCreated calls onPageCreated for page targets', async () => {
  const pluginName = 'test-plugin';
  let onPageCreatedCalled = false;

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override async onPageCreated() {
      onPageCreatedCalled = true;
    }
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);
  instance._registerChildClassMembers(prototype);

  const mockPage = { isClosed: () => false };
  const mockTarget = {
    type: () => 'page',
    page: vi.fn().mockResolvedValue(mockPage),
  };

  await instance._onTargetCreated(mockTarget as any);

  expect(onPageCreatedCalled).toBe(true);
});

test('_onTargetCreated handles non-page targets', async () => {
  const pluginName = 'test-plugin';
  let onTargetCreatedCalled = false;

  class Plugin extends PuppeteerExtraPlugin {
    constructor(opts = {}) {
      super(opts);
    }
    override get name() {
      return pluginName;
    }
    override async onTargetCreated() {
      onTargetCreatedCalled = true;
    }
  }
  const instance = new Plugin();
  const prototype = Object.getPrototypeOf(instance);
  instance._registerChildClassMembers(prototype);

  const mockTarget = {
    type: () => 'other',
  };

  await instance._onTargetCreated(mockTarget as any);

  expect(onTargetCreatedCalled).toBe(true);
});
