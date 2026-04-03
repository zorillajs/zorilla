const PLUGIN_NAME = 'stealth';

import { expect, test } from 'vitest';

import Plugin from '../dist/index.js';

type StealthPluginInstance = ReturnType<typeof Plugin> & {
  opts: {
    enabledEvasions: Set<string>;
  };
  availableEvasions: Set<string>;
  dependencies: Set<string>;
};

test('is a function', async () => {
  expect(typeof Plugin).toBe('function');
});

test('should have the basic class members', async () => {
  const instance = Plugin() as StealthPluginInstance;
  expect(instance.name).toBe(PLUGIN_NAME);
  expect(instance._isPuppeteerExtraPlugin).toBe(true);
});

test('should have the public child class members', async () => {
  const instance = Plugin() as StealthPluginInstance;
  const prototype = Object.getPrototypeOf(instance);
  const childClassMembers = Object.getOwnPropertyNames(prototype);

  expect(childClassMembers.includes('constructor')).toBe(true);
  expect(childClassMembers.includes('name')).toBe(true);
  expect(childClassMembers.includes('name')).toBe(true);
  expect(childClassMembers.includes('defaults')).toBe(true);
  expect(childClassMembers.includes('availableEvasions')).toBe(true);
  expect(childClassMembers.includes('enabledEvasions')).toBe(true);
  expect(childClassMembers.length).toBe(7);
});

test('should have opts with default values', async () => {
  const instance = Plugin() as StealthPluginInstance;
  expect(instance.opts.enabledEvasions).toEqual(instance.availableEvasions);
});

test('should add all dependencies dynamically', async () => {
  const instance = Plugin() as StealthPluginInstance;
  const deps = new Set(
    [...instance.opts.enabledEvasions].map(e => `${PLUGIN_NAME}/evasions/${e}`)
  );
  expect(instance.dependencies).toEqual(deps);
});

test('should add all dependencies dynamically including changes', async () => {
  const instance = Plugin() as StealthPluginInstance;
  const fakeDep = 'foobar';
  instance.enabledEvasions = new Set([fakeDep]);
  expect(instance.dependencies).toEqual(
    new Set([`${PLUGIN_NAME}/evasions/${fakeDep}`])
  );
});
