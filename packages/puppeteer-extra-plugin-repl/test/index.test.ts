const PLUGIN_NAME = 'repl';

import { expect, test } from 'vitest';

import Plugin from '../src/index.js';

test('is a function', async () => {
  expect(typeof Plugin).toBe('function');
});

test('should have the basic class members', async () => {
  const instance = Plugin();
  expect(instance.name).toBe(PLUGIN_NAME);
  expect(instance._isPuppeteerExtraPlugin).toBe(true);
});

test('should have the public child class members', async () => {
  const instance = Plugin();
  const prototype = Object.getPrototypeOf(instance);
  const childClassMembers = Object.getOwnPropertyNames(prototype);

  expect(childClassMembers.includes('constructor')).toBe(true);
  expect(childClassMembers.includes('name')).toBe(true);
  expect(childClassMembers.includes('defaults')).toBe(true);
  expect(childClassMembers.includes('requirements')).toBe(true);
  expect(childClassMembers.includes('repl')).toBe(true);
  expect(childClassMembers.includes('onPageCreated')).toBe(true);
  expect(childClassMembers.length).toBe(6);
});

test('should have opts with default values', async () => {
  const instance = Plugin();
  const opts = instance.opts;

  expect(opts.addToPuppeteerClass).toBe(true);
});

test('repl method exists and is callable', async () => {
  const instance = Plugin();
  expect(typeof instance.repl).toBe('function');
});

test('onPageCreated adds repl method when addToPuppeteerClass is true', async () => {
  const instance = Plugin({ addToPuppeteerClass: true });
  const mockPage: any = {
    browser: () => ({}),
  };

  await instance.onPageCreated(mockPage);
  expect(typeof mockPage.repl).toBe('function');
});

test('onPageCreated does not add repl method when addToPuppeteerClass is false', async () => {
  const instance = Plugin({ addToPuppeteerClass: false });
  const mockPage: any = {
    browser: () => ({}),
  };

  await instance.onPageCreated(mockPage);
  expect(mockPage.repl).toBeUndefined();
});
