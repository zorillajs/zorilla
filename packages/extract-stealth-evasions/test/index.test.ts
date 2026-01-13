import fs from 'node:fs';
import puppeteer from '@zorilla/puppeteer-extra';
import stealth from '@zorilla/puppeteer-extra-plugin-stealth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  configureStealthPlugin,
  createPatchEval,
  type ExtractOptions,
  extractScripts,
  generateOutput,
  handleError,
  isMainModule,
  main,
  minifyScripts,
  parseArguments,
  writeOutputFile,
} from '../src/index.js';

// Mock the stealth plugin
vi.mock('@zorilla/puppeteer-extra-plugin-stealth', () => ({
  default: vi.fn(),
}));

// Mock puppeteer
vi.mock('@zorilla/puppeteer-extra', () => ({
  default: {
    use: vi.fn().mockReturnThis(),
    launch: vi.fn(),
  },
}));

describe('parseArguments', () => {
  it('should parse exclude as string', () => {
    const result = parseArguments(['node', 'script', '-e', 'test-evasion']);
    expect(result.exclude).toBe('test-evasion');
  });

  it('should parse exclude as array', () => {
    const result = parseArguments([
      'node',
      'script',
      '-e',
      'evasion1',
      '-e',
      'evasion2',
    ]);
    expect(Array.isArray(result.exclude)).toBe(true);
    expect(result.exclude).toEqual(['evasion1', 'evasion2']);
  });

  it('should parse include as string', () => {
    const result = parseArguments(['node', 'script', '-i', 'test-evasion']);
    expect(result.include).toBe('test-evasion');
  });

  it('should parse include as array', () => {
    const result = parseArguments([
      'node',
      'script',
      '-i',
      'evasion1',
      '-i',
      'evasion2',
    ]);
    expect(Array.isArray(result.include)).toBe(true);
    expect(result.include).toEqual(['evasion1', 'evasion2']);
  });

  it('should parse list flag', () => {
    const result = parseArguments(['node', 'script', '-l']);
    expect(result.list).toBe(true);
  });

  it('should parse minify flag with default true', () => {
    const result = parseArguments(['node', 'script']);
    expect(result.minify).toBe(true);
  });

  it('should parse minify flag as false', () => {
    const result = parseArguments(['node', 'script', '--no-minify']);
    expect(result.minify).toBe(false);
  });
});

describe('configureStealthPlugin', () => {
  let mockPlugin: ReturnType<typeof stealth>;

  beforeEach(() => {
    mockPlugin = {
      enabledEvasions: new Set(['evasion1', 'evasion2', 'evasion3']),
      availableEvasions: new Set([
        'evasion1',
        'evasion2',
        'evasion3',
        'evasion4',
      ]),
    } as any;
  });

  it('should exclude a single evasion', () => {
    const options: ExtractOptions = { exclude: 'evasion1' };
    configureStealthPlugin(mockPlugin, options);
    expect(mockPlugin.enabledEvasions.has('evasion1')).toBe(false);
    expect(mockPlugin.enabledEvasions.has('evasion2')).toBe(true);
  });

  it('should exclude multiple evasions', () => {
    const options: ExtractOptions = { exclude: ['evasion1', 'evasion2'] };
    configureStealthPlugin(mockPlugin, options);
    expect(mockPlugin.enabledEvasions.has('evasion1')).toBe(false);
    expect(mockPlugin.enabledEvasions.has('evasion2')).toBe(false);
    expect(mockPlugin.enabledEvasions.has('evasion3')).toBe(true);
  });

  it('should include a single evasion', () => {
    const options: ExtractOptions = { include: 'evasion4' };
    configureStealthPlugin(mockPlugin, options);
    expect(mockPlugin.enabledEvasions).toEqual(new Set(['evasion4']));
  });

  it('should include multiple evasions', () => {
    const options: ExtractOptions = { include: ['evasion3', 'evasion4'] };
    configureStealthPlugin(mockPlugin, options);
    expect(mockPlugin.enabledEvasions).toEqual(
      new Set(['evasion3', 'evasion4'])
    );
  });

  it('should do nothing when no options are provided', () => {
    const options: ExtractOptions = {};
    const originalEvasions = new Set(mockPlugin.enabledEvasions);
    configureStealthPlugin(mockPlugin, options);
    expect(mockPlugin.enabledEvasions).toEqual(originalEvasions);
  });

  it('should prioritize exclude over include', () => {
    const options: ExtractOptions = {
      exclude: 'evasion1',
      include: 'evasion2',
    };
    configureStealthPlugin(mockPlugin, options);
    expect(mockPlugin.enabledEvasions.has('evasion1')).toBe(false);
    expect(mockPlugin.enabledEvasions.has('evasion2')).toBe(true);
  });
});

describe('createPatchEval', () => {
  it('should accumulate scripts without arguments', () => {
    const container = { scripts: '' };
    const patchEval = createPatchEval(container);

    const mockFunction = () => {
      console.log('test');
    };
    patchEval.call({} as any, mockFunction);

    expect(container.scripts).toContain(mockFunction.toString());
    expect(container.scripts).toContain('();\n');
  });

  it('should accumulate scripts with arguments', () => {
    const container = { scripts: '' };
    const patchEval = createPatchEval(container);

    const mockFunction = (opts: any) => {
      console.log(opts);
    };
    const args = { test: 'value' };
    patchEval.call({} as any, mockFunction, args);

    expect(container.scripts).toContain(mockFunction.toString());
    expect(container.scripts).toContain(JSON.stringify(args));
  });

  it('should accumulate multiple scripts', () => {
    const container = { scripts: '' };
    const patchEval = createPatchEval(container);

    const func1 = () => {
      console.log('func1');
    };
    const func2 = () => {
      console.log('func2');
    };

    patchEval.call({} as any, func1);
    patchEval.call({} as any, func2);

    expect(container.scripts).toContain(func1.toString());
    expect(container.scripts).toContain(func2.toString());
  });
});

describe('generateOutput', () => {
  it('should generate output without minification', async () => {
    const scripts = 'function test() { console.log("hello"); }';
    const output = await generateOutput(scripts, false);

    expect(output).toContain('/*!');
    expect(output).toContain('Auto-generated');
    expect(output).toContain(scripts);
    expect(output).toContain('License: MIT');
  });

  it('should generate output with minification', async () => {
    const scripts = 'function test() { console.log("hello"); }';
    const output = await generateOutput(scripts, true);

    expect(output).toContain('/*!');
    expect(output).toContain('Auto-generated');
    expect(output).toContain('License: MIT');
    // Minified code should be shorter
    expect(output.length).toBeLessThan(scripts.length + 200);
  });

  it('should handle empty scripts', async () => {
    const scripts = '';
    const output = await generateOutput(scripts, false);

    expect(output).toContain('/*!');
    expect(output).toContain('Auto-generated');
  });

  it('should handle empty scripts with minification', async () => {
    const scripts = '';
    const output = await generateOutput(scripts, true);

    expect(output).toContain('/*!');
    expect(output).toContain('Auto-generated');
  });

  it('should include generation date in output', async () => {
    const scripts = 'function test() {}';
    const output = await generateOutput(scripts, false);

    expect(output).toContain('Generated on:');
  });

  it('should handle minification with complex scripts', async () => {
    const scripts =
      'function test() { const x = 1; const y = 2; return x + y; }';
    const output = await generateOutput(scripts, true);

    expect(output).toContain('/*!');
    expect(output).toContain('License: MIT');
  });
});

describe('minifyScripts', () => {
  it('should minify valid scripts', async () => {
    const scripts = 'function test(x, y) { return x + y; } test(1, 2);';
    const result = await minifyScripts(scripts);

    expect(typeof result).toBe('string');
    // Minified code may be empty or shorter
    expect(result.length).toBeLessThanOrEqual(scripts.length);
  });

  it('should handle empty scripts', async () => {
    const scripts = '';
    const result = await minifyScripts(scripts);

    expect(typeof result).toBe('string');
  });

  it('should handle nullish coalescing when minify returns undefined', async () => {
    // This tests the ?? '' operator in minifyScripts
    // We test with a script that might produce undefined code
    const scripts = '';
    const result = await minifyScripts(scripts);

    // Should return empty string if code is undefined
    expect(result).toBe('');
  });
});

describe('writeOutputFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should write file successfully', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(null);
      });

    await writeOutputFile('test.js', 'content');

    expect(writeFileSpy).toHaveBeenCalledWith(
      'test.js',
      'content',
      expect.any(Function)
    );
  });

  it('should reject on write error', async () => {
    const error = new Error('Write failed');
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(error);
      });

    await expect(writeOutputFile('test.js', 'content')).rejects.toThrow(
      'Write failed'
    );

    expect(writeFileSpy).toHaveBeenCalled();
  });
});

describe('extractScripts', () => {
  let mockPlugin: ReturnType<typeof stealth>;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    mockPlugin = {
      enabledEvasions: new Set(['evasion1']),
      availableEvasions: new Set(['evasion1']),
    } as any;

    mockPage = {
      __proto__: {},
      goto: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      pages: vi.fn().mockResolvedValue([mockPage]),
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    (puppeteer.launch as any) = vi.fn().mockResolvedValue(mockBrowser);
    (puppeteer.use as any) = vi.fn().mockReturnValue(puppeteer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should extract scripts from puppeteer', async () => {
    const scripts = await extractScripts(mockPlugin);

    expect(puppeteer.use).toHaveBeenCalledWith(mockPlugin);
    expect(puppeteer.launch).toHaveBeenCalledWith({ headless: true });
    expect(mockBrowser.pages).toHaveBeenCalled();
    expect(mockBrowser.newPage).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('about:blank');
    expect(mockBrowser.close).toHaveBeenCalled();
    expect(typeof scripts).toBe('string');
  });

  it('should close browser even if error occurs', async () => {
    mockPage.goto = vi.fn().mockRejectedValue(new Error('Navigation failed'));

    await expect(extractScripts(mockPlugin)).rejects.toThrow(
      'Navigation failed'
    );
    expect(mockBrowser.close).toHaveBeenCalled();
  });
});

describe('main', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let mockPlugin: ReturnType<typeof stealth>;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockPlugin = {
      enabledEvasions: new Set(['evasion1', 'evasion2']),
      availableEvasions: new Set(['evasion1', 'evasion2', 'evasion3']),
    } as any;
    (stealth as any).mockReturnValue(mockPlugin);

    mockPage = {
      __proto__: {},
      goto: vi.fn().mockResolvedValue(undefined),
    };

    mockBrowser = {
      pages: vi.fn().mockResolvedValue([mockPage]),
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    (puppeteer.launch as any) = vi.fn().mockResolvedValue(mockBrowser);
    (puppeteer.use as any) = vi.fn().mockReturnValue(puppeteer);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('should list available evasions', async () => {
    await main(['node', 'script', '--list']);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Available evasions:',
      expect.stringContaining('evasion1')
    );
  });

  it('should handle list command and exit early', async () => {
    const writeFileSpy = vi.spyOn(fs, 'writeFile');

    await main(['node', 'script', '-l']);

    expect(writeFileSpy).not.toHaveBeenCalled();
  });

  it('should run full extraction with minify', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(null);
      });

    await main(['node', 'script']);

    expect(writeFileSpy).toHaveBeenCalledWith(
      'stealth.min.js',
      expect.any(String),
      expect.any(Function)
    );
    expect(consoleSpy).toHaveBeenCalledWith('File stealth.min.js written!');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Included evasions: ',
      expect.any(String)
    );
  });

  it('should run full extraction without minify', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(null);
      });

    await main(['node', 'script', '--no-minify']);

    expect(writeFileSpy).toHaveBeenCalledWith(
      'stealth.js',
      expect.any(String),
      expect.any(Function)
    );
    expect(consoleSpy).toHaveBeenCalledWith('File stealth.js written!');
  });

  it('should handle exclude option', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(null);
      });

    await main(['node', 'script', '-e', 'evasion1']);

    expect(mockPlugin.enabledEvasions.has('evasion1')).toBe(false);
    expect(writeFileSpy).toHaveBeenCalled();
  });

  it('should handle include option', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(null);
      });

    await main(['node', 'script', '-i', 'evasion3']);

    expect(mockPlugin.enabledEvasions).toEqual(new Set(['evasion3']));
    expect(writeFileSpy).toHaveBeenCalled();
  });

  it('should handle errors during extraction', async () => {
    mockBrowser.pages = vi.fn().mockRejectedValue(new Error('Browser error'));

    await expect(main(['node', 'script'])).rejects.toThrow('Browser error');
  });

  it('should handle errors during file write', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(new Error('Write error'));
      });

    await expect(main(['node', 'script'])).rejects.toThrow('Write error');
    expect(writeFileSpy).toHaveBeenCalled();
  });

  it('should handle minify option as undefined', async () => {
    const writeFileSpy = vi
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, callback: any) => {
        callback(null);
      });

    // Parse with no minify flag should default to true
    await main(['node', 'script']);

    expect(writeFileSpy).toHaveBeenCalledWith(
      'stealth.min.js',
      expect.any(String),
      expect.any(Function)
    );
  });
});

describe('handleError', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should log error and exit with code 1', () => {
    const error = new Error('Test error');

    expect(() => handleError(error)).toThrow('process.exit called');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});

describe('isMainModule', () => {
  it('should return false when imported as module', () => {
    // When running tests, the module is imported, not run directly
    const result = isMainModule();
    expect(result).toBe(false);
  });
});
