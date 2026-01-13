const PLUGIN_NAME = 'anonymize-ua';

import type { Page } from 'puppeteer';
import { expect, test, vi } from 'vitest';

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
  expect(childClassMembers.includes('onPageCreated')).toBe(true);
  expect(childClassMembers.length).toBe(4);
});

test('should have opts with default values', async () => {
  const instance = Plugin();
  const opts = instance.opts;

  expect(opts.stripHeadless).toBe(true);
  expect(opts.makeWindows).toBe(true);
  expect(opts.customFn).toBe(null);
});

test('should accept custom options', async () => {
  const customFn = (ua: string) => ua.replace('Chrome', 'Beer');
  const instance = Plugin({
    stripHeadless: false,
    makeWindows: false,
    customFn,
  });

  expect(instance.opts.stripHeadless).toBe(false);
  expect(instance.opts.makeWindows).toBe(false);
  expect(instance.opts.customFn).toBe(customFn);
});

test('should modify user agent with stripHeadless', async () => {
  const instance = Plugin({ stripHeadless: true, makeWindows: false });

  const mockUserAgent =
    'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/91.0.4472.124 Safari/537.36';
  const mockSetUserAgent = vi.fn();
  const mockPage = {
    browser: () => ({
      userAgent: () => Promise.resolve(mockUserAgent),
    }),
    setUserAgent: mockSetUserAgent,
  } as unknown as Page;

  await instance.onPageCreated(mockPage);

  expect(mockSetUserAgent).toHaveBeenCalledOnce();
  const calledUA = mockSetUserAgent.mock.calls[0][0];
  expect(calledUA).not.toContain('HeadlessChrome');
  expect(calledUA).toContain('Chrome/91.0.4472.124');
  expect(calledUA).toContain('X11; Linux x86_64');
});

test('should modify user agent with makeWindows', async () => {
  const instance = Plugin({ stripHeadless: false, makeWindows: true });

  const mockUserAgent =
    'Mozilla/5.0 (X11; Linux x86_64) Chrome/91.0.4472.124 Safari/537.36';
  const mockSetUserAgent = vi.fn();
  const mockPage = {
    browser: () => ({
      userAgent: () => Promise.resolve(mockUserAgent),
    }),
    setUserAgent: mockSetUserAgent,
  } as unknown as Page;

  await instance.onPageCreated(mockPage);

  expect(mockSetUserAgent).toHaveBeenCalledOnce();
  const calledUA = mockSetUserAgent.mock.calls[0][0];
  expect(calledUA).toContain('Windows NT 10.0; Win64; x64');
  expect(calledUA).not.toContain('X11; Linux x86_64');
});

test('should modify user agent with both stripHeadless and makeWindows', async () => {
  const instance = Plugin({ stripHeadless: true, makeWindows: true });

  const mockUserAgent =
    'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/91.0.4472.124 Safari/537.36';
  const mockSetUserAgent = vi.fn();
  const mockPage = {
    browser: () => ({
      userAgent: () => Promise.resolve(mockUserAgent),
    }),
    setUserAgent: mockSetUserAgent,
  } as unknown as Page;

  await instance.onPageCreated(mockPage);

  expect(mockSetUserAgent).toHaveBeenCalledOnce();
  const calledUA = mockSetUserAgent.mock.calls[0][0];
  expect(calledUA).not.toContain('HeadlessChrome');
  expect(calledUA).toContain('Chrome/91.0.4472.124');
  expect(calledUA).toContain('Windows NT 10.0; Win64; x64');
  expect(calledUA).not.toContain('X11; Linux x86_64');
});

test('should apply customFn when provided', async () => {
  const customFn = (ua: string) =>
    'MyCoolAgent/' + ua.replace('Chrome', 'Beer');
  const instance = Plugin({ stripHeadless: true, makeWindows: true, customFn });

  const mockUserAgent =
    'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/91.0.4472.124 Safari/537.36';
  const mockSetUserAgent = vi.fn();
  const mockPage = {
    browser: () => ({
      userAgent: () => Promise.resolve(mockUserAgent),
    }),
    setUserAgent: mockSetUserAgent,
  } as unknown as Page;

  await instance.onPageCreated(mockPage);

  expect(mockSetUserAgent).toHaveBeenCalledOnce();
  const calledUA = mockSetUserAgent.mock.calls[0][0];
  expect(calledUA).toContain('MyCoolAgent/Mozilla');
  expect(calledUA).toContain('Beer/91.0.4472.124');
  expect(calledUA).not.toContain('Chrome');
  expect(calledUA).not.toContain('HeadlessChrome');
});

test('should not modify user agent when all options are disabled', async () => {
  const instance = Plugin({
    stripHeadless: false,
    makeWindows: false,
    customFn: null,
  });

  const mockUserAgent =
    'Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/91.0.4472.124 Safari/537.36';
  const mockSetUserAgent = vi.fn();
  const mockPage = {
    browser: () => ({
      userAgent: () => Promise.resolve(mockUserAgent),
    }),
    setUserAgent: mockSetUserAgent,
  } as unknown as Page;

  await instance.onPageCreated(mockPage);

  expect(mockSetUserAgent).toHaveBeenCalledOnce();
  const calledUA = mockSetUserAgent.mock.calls[0][0];
  expect(calledUA).toBe(mockUserAgent);
});
