import { describe, expect, test, vi } from 'vitest';
import Plugin from '../src/index.js';

const PLUGIN_NAME = 'block-resources';

type MockRequest = any;
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
    expect(childClassMembers.includes('defaults')).toBe(true);
    expect(childClassMembers.includes('availableTypes')).toBe(true);
    expect(childClassMembers.includes('blockedTypes')).toBe(true);
    expect(childClassMembers.includes('interceptResolutionPriority')).toBe(
      true
    );
    expect(childClassMembers.includes('onRequest')).toBe(true);
    expect(childClassMembers.includes('onPageCreated')).toBe(true);
    expect(childClassMembers.length === 8).toBe(true);
  });
});

describe('Default options', () => {
  test('should have opts with default values', () => {
    const instance = Plugin();
    expect(instance.opts.blockedTypes).toEqual(new Set([]));
    expect(instance.opts.availableTypes.size).toBe(13);
    expect(instance.opts.interceptResolutionPriority).toBe(undefined);
  });

  test('should allow custom blocked types', () => {
    const blockedTypes = new Set(['image', 'stylesheet']);
    const instance = Plugin({ blockedTypes });
    expect(instance.opts.blockedTypes).toBe(blockedTypes);
    expect(instance.blockedTypes.has('image')).toBe(true);
    expect(instance.blockedTypes.has('stylesheet')).toBe(true);
  });

  test('should allow custom interceptResolutionPriority', () => {
    const instance = Plugin({ interceptResolutionPriority: 10 });
    expect(instance.opts.interceptResolutionPriority).toBe(10);
    expect(instance.interceptResolutionPriority).toBe(10);
  });
});

describe('availableTypes getter', () => {
  test('should return all 13 available resource types', () => {
    const instance = Plugin();
    const types = instance.availableTypes;
    expect(types.size).toBe(13);
    expect(types.has('document')).toBe(true);
    expect(types.has('stylesheet')).toBe(true);
    expect(types.has('image')).toBe(true);
    expect(types.has('media')).toBe(true);
    expect(types.has('font')).toBe(true);
    expect(types.has('script')).toBe(true);
    expect(types.has('texttrack')).toBe(true);
    expect(types.has('xhr')).toBe(true);
    expect(types.has('fetch')).toBe(true);
    expect(types.has('eventsource')).toBe(true);
    expect(types.has('websocket')).toBe(true);
    expect(types.has('manifest')).toBe(true);
    expect(types.has('other')).toBe(true);
  });
});

describe('blockedTypes getter', () => {
  test('should return empty set by default', () => {
    const instance = Plugin();
    expect(instance.blockedTypes.size).toBe(0);
  });

  test('should return configured blocked types', () => {
    const instance = Plugin({ blockedTypes: new Set(['image']) });
    expect(instance.blockedTypes.size).toBe(1);
    expect(instance.blockedTypes.has('image')).toBe(true);
  });
});

describe('onRequest method', () => {
  test('should continue request if type is not blocked', () => {
    const instance = Plugin();
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };

    instance.onRequest(mockRequest as MockRequest);
    expect(mockRequest.continue).toHaveBeenCalledOnce();
    expect(mockRequest.abort).not.toHaveBeenCalled();
  });

  test('should abort request if type is blocked', () => {
    const instance = Plugin({ blockedTypes: new Set(['image']) });
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };

    instance.onRequest(mockRequest as MockRequest);
    expect(mockRequest.abort).toHaveBeenCalledOnce();
    expect(mockRequest.continue).not.toHaveBeenCalled();
  });

  test('should not handle request if already handled (cooperative mode)', () => {
    const instance = Plugin({ blockedTypes: new Set(['image']) });
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: () => true,
      continue: vi.fn(),
      abort: vi.fn(),
    };

    instance.onRequest(mockRequest as MockRequest);
    expect(mockRequest.abort).not.toHaveBeenCalled();
    expect(mockRequest.continue).not.toHaveBeenCalled();
  });

  test('should handle multiple resource types', () => {
    const instance = Plugin({
      blockedTypes: new Set(['image', 'stylesheet', 'font']),
    });

    const imageRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };
    instance.onRequest(imageRequest as MockRequest);
    expect(imageRequest.abort).toHaveBeenCalled();

    const scriptRequest = {
      resourceType: () => 'script',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };
    instance.onRequest(scriptRequest as MockRequest);
    expect(scriptRequest.continue).toHaveBeenCalled();
  });

  test('should use Cooperative Intercept Mode when available (abort)', () => {
    const instance = Plugin({
      blockedTypes: new Set(['image']),
      interceptResolutionPriority: 5,
    });
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: () => false,
      abortErrorReason: 'test',
      continue: vi.fn(),
      abort: vi.fn(),
    };

    instance.onRequest(mockRequest as MockRequest);
    expect(mockRequest.abort).toHaveBeenCalledWith('blockedbyclient', 5);
  });

  test('should use Cooperative Intercept Mode when available (continue)', () => {
    const instance = Plugin({ interceptResolutionPriority: 5 });
    const mockOverrides = { foo: 'bar' };
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: () => false,
      continueRequestOverrides: () => mockOverrides,
      continue: vi.fn(),
      abort: vi.fn(),
    };

    instance.onRequest(mockRequest as MockRequest);
    expect(mockRequest.continue).toHaveBeenCalledWith(mockOverrides, 5);
  });

  test('should use standard mode when priority not set', () => {
    const instance = Plugin({ blockedTypes: new Set(['image']) });
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      abortErrorReason: 'test',
      continue: vi.fn(),
      abort: vi.fn(),
    };

    instance.onRequest(mockRequest as MockRequest);
    expect(mockRequest.abort).toHaveBeenCalledWith();
  });
});

describe('onPageCreated method', () => {
  test('should enable request interception and add listener', async () => {
    const instance = Plugin();
    const mockPage = {
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };

    await instance.onPageCreated(mockPage as MockPage);

    expect(mockPage.setRequestInterception).toHaveBeenCalledWith(true);
    expect(mockPage.on).toHaveBeenCalledWith('request', expect.any(Function));
  });

  test('should bind onRequest handler correctly', async () => {
    const instance = Plugin({ blockedTypes: new Set(['image']) });
    const mockPage = {
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };

    await instance.onPageCreated(mockPage as MockPage);

    // Get the bound handler
    const handler = mockPage.on.mock.calls[0][1];

    // Create a mock request and call the handler
    const mockRequest = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };

    handler(mockRequest);
    expect(mockRequest.abort).toHaveBeenCalled();
  });
});

describe('Dynamic blocking', () => {
  test('should allow adding blocked types dynamically', () => {
    const instance = Plugin();
    expect(instance.blockedTypes.size).toBe(0);

    instance.blockedTypes.add('image');
    expect(instance.blockedTypes.size).toBe(1);
    expect(instance.blockedTypes.has('image')).toBe(true);
  });

  test('should allow removing blocked types dynamically', () => {
    const instance = Plugin({ blockedTypes: new Set(['image', 'stylesheet']) });
    expect(instance.blockedTypes.size).toBe(2);

    instance.blockedTypes.delete('image');
    expect(instance.blockedTypes.size).toBe(1);
    expect(instance.blockedTypes.has('image')).toBe(false);
    expect(instance.blockedTypes.has('stylesheet')).toBe(true);
  });

  test('should reflect dynamic changes in request handling', () => {
    const instance = Plugin();

    // Initially no blocking
    const mockRequest1 = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };
    instance.onRequest(mockRequest1 as MockRequest);
    expect(mockRequest1.continue).toHaveBeenCalled();

    // Add blocking
    instance.blockedTypes.add('image');

    const mockRequest2 = {
      resourceType: () => 'image',
      isInterceptResolutionHandled: undefined,
      continue: vi.fn(),
      abort: vi.fn(),
    };
    instance.onRequest(mockRequest2 as MockRequest);
    expect(mockRequest2.abort).toHaveBeenCalled();
  });
});
