import type {
  ClickOptions,
  HTTPResponse,
  Page,
  WaitForOptions,
} from 'puppeteer';
import { describe, expect, test, vi } from 'vitest';
import Plugin from '../src/index.js';

const PLUGIN_NAME = 'click-and-wait';

type MockPage = any;

describe('Plugin instantiation and structure', () => {
  test('should be a function', () => {
    expect(typeof Plugin).toBe('function');
  });

  test('should have the basic class members', () => {
    const instance = Plugin();
    expect(instance.name).toBe(PLUGIN_NAME);
    expect(instance._isPuppeteerExtraPlugin).toBe(true);
  });

  test('should have the public child class members', () => {
    const instance = Plugin();
    const prototype = Object.getPrototypeOf(instance);
    const childClassMembers = Object.getOwnPropertyNames(prototype);

    expect(childClassMembers.includes('constructor')).toBe(true);
    expect(childClassMembers.includes('name')).toBe(true);
    expect(childClassMembers.includes('clickAndWaitForNavigation')).toBe(true);
    expect(childClassMembers.includes('onPageCreated')).toBe(true);
    expect(childClassMembers.length).toBe(4);
  });

  test('should accept empty options', () => {
    const instance = Plugin();
    expect(instance).toBeTruthy();
  });

  test('should accept custom options', () => {
    const instance = Plugin({ someOption: 'test' });
    expect(instance).toBeTruthy();
  });
});

describe('clickAndWaitForNavigation method', () => {
  test('should return a promise that resolves to HTTPResponse', async () => {
    const instance = Plugin();
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
      ok: () => true,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    const result = await instance.clickAndWaitForNavigation.call(
      mockPage as Page,
      '#button'
    );

    expect(result).toBe(mockResponse);
    expect(mockPage.waitForNavigation).toHaveBeenCalledOnce();
    expect(mockPage.click).toHaveBeenCalledOnce();
  });

  test('should call waitForNavigation and click with correct selector', async () => {
    const instance = Plugin();
    const selector = '#submit-button';
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.clickAndWaitForNavigation.call(mockPage as Page, selector);

    expect(mockPage.click).toHaveBeenCalledWith(selector, undefined);
  });

  test('should pass click options to click method', async () => {
    const instance = Plugin();
    const selector = '#button';
    const clickOptions: ClickOptions = {
      button: 'right',
      clickCount: 2,
      delay: 100,
    };
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.clickAndWaitForNavigation.call(
      mockPage as Page,
      selector,
      clickOptions
    );

    expect(mockPage.click).toHaveBeenCalledWith(selector, clickOptions);
  });

  test('should pass wait options to waitForNavigation method', async () => {
    const instance = Plugin();
    const selector = '#button';
    const waitOptions: WaitForOptions = {
      waitUntil: 'networkidle0',
      timeout: 5000,
    };
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.clickAndWaitForNavigation.call(
      mockPage as Page,
      selector,
      undefined,
      waitOptions
    );

    expect(mockPage.waitForNavigation).toHaveBeenCalledWith(waitOptions);
  });

  test('should pass both click and wait options', async () => {
    const instance = Plugin();
    const selector = '.link';
    const clickOptions: ClickOptions = {
      button: 'middle',
    };
    const waitOptions: WaitForOptions = {
      waitUntil: 'load',
      timeout: 10000,
    };
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.clickAndWaitForNavigation.call(
      mockPage as Page,
      selector,
      clickOptions,
      waitOptions
    );

    expect(mockPage.click).toHaveBeenCalledWith(selector, clickOptions);
    expect(mockPage.waitForNavigation).toHaveBeenCalledWith(waitOptions);
  });

  test('should handle null response from waitForNavigation', async () => {
    const instance = Plugin();
    const selector = '#button';

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(null),
      click: vi.fn().mockResolvedValue(undefined),
    };

    const result = await instance.clickAndWaitForNavigation.call(
      mockPage as Page,
      selector
    );

    expect(result).toBeNull();
  });

  test('should execute waitForNavigation and click in parallel', async () => {
    const instance = Plugin();
    const selector = '#button';
    const executionOrder: string[] = [];

    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockImplementation(async () => {
        executionOrder.push('waitForNavigation-start');
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('waitForNavigation-end');
        return mockResponse;
      }),
      click: vi.fn().mockImplementation(async () => {
        executionOrder.push('click-start');
        await new Promise(resolve => setTimeout(resolve, 5));
        executionOrder.push('click-end');
      }),
    };

    await instance.clickAndWaitForNavigation.call(mockPage as Page, selector);

    // Both should start before either finishes (parallel execution)
    const waitStartIndex = executionOrder.indexOf('waitForNavigation-start');
    const clickStartIndex = executionOrder.indexOf('click-start');
    const waitEndIndex = executionOrder.indexOf('waitForNavigation-end');

    expect(waitStartIndex).toBeLessThan(waitEndIndex);
    expect(clickStartIndex).toBeLessThan(waitEndIndex);
  });

  test('should propagate errors from click', async () => {
    const instance = Plugin();
    const selector = '#button';
    const clickError = new Error('Click failed');

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue({}),
      click: vi.fn().mockRejectedValue(clickError),
    };

    await expect(
      instance.clickAndWaitForNavigation.call(mockPage as Page, selector)
    ).rejects.toThrow('Click failed');
  });

  test('should propagate errors from waitForNavigation', async () => {
    const instance = Plugin();
    const selector = '#button';
    const navError = new Error('Navigation timeout');

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockRejectedValue(navError),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      instance.clickAndWaitForNavigation.call(mockPage as Page, selector)
    ).rejects.toThrow('Navigation timeout');
  });
});

describe('onPageCreated method', () => {
  test('should add clickAndWaitForNavigation method to page', async () => {
    const instance = Plugin();
    const mockPage: MockPage = {};

    await instance.onPageCreated(mockPage as Page);

    expect(mockPage.clickAndWaitForNavigation).toBeDefined();
    expect(typeof mockPage.clickAndWaitForNavigation).toBe('function');
  });

  test('should bind clickAndWaitForNavigation to page context', async () => {
    const instance = Plugin();
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.onPageCreated(mockPage as Page);

    // Call the method added to the page
    const result = await mockPage.clickAndWaitForNavigation('#button');

    expect(result).toBe(mockResponse);
    expect(mockPage.waitForNavigation).toHaveBeenCalledOnce();
    expect(mockPage.click).toHaveBeenCalledOnce();
  });

  test('should properly bind page context for method calls', async () => {
    const instance = Plugin();
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
      someProperty: 'test-value',
    };

    await instance.onPageCreated(mockPage as Page);

    // Test that 'this' context is correctly bound
    await mockPage.clickAndWaitForNavigation('#button');

    // The bound function should use the page's methods
    expect(mockPage.waitForNavigation).toHaveBeenCalledOnce();
    expect(mockPage.click).toHaveBeenCalledOnce();
  });

  test('should work with all parameter combinations after binding', async () => {
    const instance = Plugin();
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.onPageCreated(mockPage as Page);

    const clickOptions: ClickOptions = { delay: 50 };
    const waitOptions: WaitForOptions = { timeout: 3000 };

    await mockPage.clickAndWaitForNavigation(
      '#button',
      clickOptions,
      waitOptions
    );

    expect(mockPage.click).toHaveBeenCalledWith('#button', clickOptions);
    expect(mockPage.waitForNavigation).toHaveBeenCalledWith(waitOptions);
  });
});

describe('Integration scenarios', () => {
  test('should handle complex selectors', async () => {
    const instance = Plugin();
    const complexSelector =
      'div.container > button[type="submit"]:nth-child(2)';
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.onPageCreated(mockPage as Page);
    await mockPage.clickAndWaitForNavigation(complexSelector);

    expect(mockPage.click).toHaveBeenCalledWith(complexSelector, undefined);
  });

  test('should work with different wait conditions', async () => {
    const instance = Plugin();
    const mockResponse: Partial<HTTPResponse> = {
      status: () => 200,
    };

    const mockPage: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.onPageCreated(mockPage as Page);

    // Test with different waitUntil options
    const waitOptions: WaitForOptions = {
      waitUntil: 'domcontentloaded',
    };

    await mockPage.clickAndWaitForNavigation('#button', undefined, waitOptions);

    expect(mockPage.waitForNavigation).toHaveBeenCalledWith(waitOptions);
  });

  test('should handle multiple pages independently', async () => {
    const instance = Plugin();
    const mockResponse1: Partial<HTTPResponse> = {
      status: () => 200,
    };
    const mockResponse2: Partial<HTTPResponse> = {
      status: () => 201,
    };

    const mockPage1: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse1),
      click: vi.fn().mockResolvedValue(undefined),
    };

    const mockPage2: MockPage = {
      waitForNavigation: vi.fn().mockResolvedValue(mockResponse2),
      click: vi.fn().mockResolvedValue(undefined),
    };

    await instance.onPageCreated(mockPage1 as Page);
    await instance.onPageCreated(mockPage2 as Page);

    const result1 = await mockPage1.clickAndWaitForNavigation('#button1');
    const result2 = await mockPage2.clickAndWaitForNavigation('#button2');

    expect(result1).toBe(mockResponse1);
    expect(result2).toBe(mockResponse2);
    expect(mockPage1.click).toHaveBeenCalledWith('#button1', undefined);
    expect(mockPage2.click).toHaveBeenCalledWith('#button2', undefined);
  });
});
