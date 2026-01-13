const PLUGIN_NAME = 'user-data-dir';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import Plugin from '../src/index.js';

describe('Plugin', () => {
  test('is a function', () => {
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

    expect(childClassMembers).toContain('constructor');
    expect(childClassMembers).toContain('name');
    expect(childClassMembers).toContain('requirements');
    expect(childClassMembers).toContain('shouldDeleteDirectory');
    expect(childClassMembers).toContain('temporaryDirectoryPath');
    expect(childClassMembers).toContain('defaultProfilePath');
    expect(childClassMembers).toContain('makeTemporaryDirectory');
    expect(childClassMembers).toContain('deleteUserDataDir');
    expect(childClassMembers).toContain('writeFilesToProfile');
    expect(childClassMembers).toContain('beforeLaunch');
    expect(childClassMembers).toContain('onDisconnected');
  });

  test('should have requirements set correctly', () => {
    const instance = Plugin();
    const requirements = instance.requirements;

    expect(requirements.has('runLast')).toBe(true);
    expect(requirements.has('dataFromPlugins')).toBe(true);
    expect(requirements.size).toBe(2);
  });
});

describe('Plugin Options', () => {
  test('should use default options', () => {
    const instance = Plugin();
    const opts = instance.opts;

    expect(opts.deleteTemporary).toBe(true);
    expect(opts.deleteExisting).toBe(false);
    expect(opts.files).toEqual([]);
    expect(opts.folderPath).toBe(os.tmpdir());
    expect(opts.folderPrefix).toBe('puppeteer_dev_profile-');
  });

  test('should accept custom options', () => {
    const customOpts = {
      deleteTemporary: false,
      deleteExisting: true,
      files: [{ target: 'Profile', file: 'test.txt', contents: 'test' }],
      folderPath: '/custom/path',
      folderPrefix: 'custom_prefix_',
    };
    const instance = Plugin(customOpts);
    const opts = instance.opts;

    expect(opts.deleteTemporary).toBe(false);
    expect(opts.deleteExisting).toBe(true);
    expect(opts.files).toEqual(customOpts.files);
    expect(opts.folderPath).toBe('/custom/path');
    expect(opts.folderPrefix).toBe('custom_prefix_');
  });

  test('should merge custom options with defaults', () => {
    const instance = Plugin({ deleteTemporary: false });
    const opts = instance.opts;

    expect(opts.deleteTemporary).toBe(false);
    expect(opts.deleteExisting).toBe(false);
    expect(opts.files).toEqual([]);
  });
});

describe('Directory Management', () => {
  test('temporaryDirectoryPath should return correct path', () => {
    const instance = Plugin();
    const expectedPath = path.join(os.tmpdir(), 'puppeteer_dev_profile-');
    expect(instance.temporaryDirectoryPath).toBe(expectedPath);
  });

  test('temporaryDirectoryPath should use custom folder path and prefix', () => {
    const instance = Plugin({
      folderPath: '/custom/path',
      folderPrefix: 'my_prefix_',
    });
    expect(instance.temporaryDirectoryPath).toBe('/custom/path/my_prefix_');
  });

  test('makeTemporaryDirectory should create a temporary directory', async () => {
    const instance = Plugin();
    await instance.makeTemporaryDirectory();

    const userDataDir = (instance as any)._userDataDir;
    const isTemporary = (instance as any)._isTemporary;

    expect(userDataDir).toBeTruthy();
    expect(typeof userDataDir).toBe('string');
    expect(userDataDir).toContain('puppeteer_dev_profile-');
    expect(isTemporary).toBe(true);

    // Cleanup
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('defaultProfilePath should return correct path', async () => {
    const instance = Plugin();
    await instance.makeTemporaryDirectory();

    const userDataDir = (instance as any)._userDataDir;
    const expectedPath = path.join(userDataDir, 'Default');

    expect(instance.defaultProfilePath).toBe(expectedPath);

    // Cleanup
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('shouldDeleteDirectory returns true for temporary dir when deleteTemporary is true', () => {
    const instance = Plugin({ deleteTemporary: true });
    (instance as any)._isTemporary = true;

    expect(instance.shouldDeleteDirectory).toBe(true);
  });

  test('shouldDeleteDirectory returns false for temporary dir when deleteTemporary is false', () => {
    const instance = Plugin({ deleteTemporary: false });
    (instance as any)._isTemporary = true;

    expect(instance.shouldDeleteDirectory).toBe(false);
  });

  test('shouldDeleteDirectory returns true when deleteExisting is true', () => {
    const instance = Plugin({ deleteExisting: true });
    (instance as any)._isTemporary = false;

    expect(instance.shouldDeleteDirectory).toBe(true);
  });

  test('shouldDeleteDirectory returns false when deleteExisting is false and not temporary', () => {
    const instance = Plugin({ deleteExisting: false });
    (instance as any)._isTemporary = false;

    expect(instance.shouldDeleteDirectory).toBe(false);
  });
});

describe('deleteUserDataDir', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-user-data-'));
  });

  afterEach(() => {
    // Ensure cleanup even if test fails
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should delete user data directory', async () => {
    const instance = Plugin();
    (instance as any)._userDataDir = tempDir;

    expect(fs.existsSync(tempDir)).toBe(true);

    instance.deleteUserDataDir();

    // Wait a bit for async deletion
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(fs.existsSync(tempDir)).toBe(false);
  });

  test('should not throw if directory does not exist', () => {
    const instance = Plugin();
    const nonExistentDir = path.join(tempDir, 'nonexistent');
    (instance as any)._userDataDir = nonExistentDir;

    expect(() => instance.deleteUserDataDir()).not.toThrow();
  });

  test('should do nothing if userDataDir is not set', () => {
    const instance = Plugin();
    (instance as any)._userDataDir = null;

    expect(() => instance.deleteUserDataDir()).not.toThrow();
  });
});

describe('writeFilesToProfile', () => {
  let tempDir: string;
  let instance: ReturnType<typeof Plugin>;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-profile-'));
    instance = Plugin();
    (instance as any)._userDataDir = tempDir;
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should write files to profile directory', async () => {
    const fileContent = 'test content';
    const fileName = 'test.txt';
    const pluginWithFiles = Plugin({
      files: [{ target: 'Profile', file: fileName, contents: fileContent }],
    });
    (pluginWithFiles as any)._userDataDir = tempDir;

    await pluginWithFiles.writeFilesToProfile();

    const filePath = path.join(tempDir, 'Default', fileName);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(fileContent);
  });

  test('should create nested directories when writing files', async () => {
    const fileName = 'nested/dir/test.txt';
    const fileContent = 'nested content';
    const pluginWithFiles = Plugin({
      files: [{ target: 'Profile', file: fileName, contents: fileContent }],
    });
    (pluginWithFiles as any)._userDataDir = tempDir;

    await pluginWithFiles.writeFilesToProfile();

    const filePath = path.join(tempDir, 'Default', fileName);
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(fileContent);
  });

  test('should not write files with invalid target', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const pluginWithFiles = Plugin({
      files: [
        { target: 'InvalidTarget', file: 'test.txt', contents: 'test' } as any,
      ],
    });
    (pluginWithFiles as any)._userDataDir = tempDir;

    await pluginWithFiles.writeFilesToProfile();

    const filePath = path.join(tempDir, 'Default', 'test.txt');
    expect(fs.existsSync(filePath)).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Warning: Ignoring file with invalid target',
      expect.any(Object)
    );

    consoleWarnSpy.mockRestore();
  });

  test('should handle errors when writing files', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    // Create a directory where we want to write a file (will cause error)
    const conflictPath = path.join(tempDir, 'Default', 'conflict.txt');
    fs.mkdirSync(path.dirname(conflictPath), { recursive: true });
    fs.mkdirSync(conflictPath);

    const pluginWithFiles = Plugin({
      files: [{ target: 'Profile', file: 'conflict.txt', contents: 'test' }],
    });
    (pluginWithFiles as any)._userDataDir = tempDir;

    await pluginWithFiles.writeFilesToProfile();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Warning: Failure writing file',
      expect.any(String),
      expect.any(Object),
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  test('should handle files from other plugins via getDataFromPlugins', async () => {
    const instance = Plugin();
    (instance as any)._userDataDir = tempDir;

    // Mock getDataFromPlugins to return file data
    instance.getDataFromPlugins = vi.fn().mockReturnValue([
      {
        value: {
          target: 'Profile',
          file: 'plugin.txt',
          contents: 'from plugin',
        },
      },
    ]);

    await instance.writeFilesToProfile();

    const filePath = path.join(tempDir, 'Default', 'plugin.txt');
    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe('from plugin');
  });

  test('should merge files from plugins and options', async () => {
    const pluginWithFiles = Plugin({
      files: [
        { target: 'Profile', file: 'option.txt', contents: 'from option' },
      ],
    });
    (pluginWithFiles as any)._userDataDir = tempDir;

    pluginWithFiles.getDataFromPlugins = vi.fn().mockReturnValue([
      {
        value: {
          target: 'Profile',
          file: 'plugin.txt',
          contents: 'from plugin',
        },
      },
    ]);

    await pluginWithFiles.writeFilesToProfile();

    const pluginFilePath = path.join(tempDir, 'Default', 'plugin.txt');
    const optionFilePath = path.join(tempDir, 'Default', 'option.txt');

    expect(fs.existsSync(pluginFilePath)).toBe(true);
    expect(fs.existsSync(optionFilePath)).toBe(true);
    expect(fs.readFileSync(pluginFilePath, 'utf-8')).toBe('from plugin');
    expect(fs.readFileSync(optionFilePath, 'utf-8')).toBe('from option');
  });

  test('should do nothing when no files to write', async () => {
    instance.getDataFromPlugins = vi.fn().mockReturnValue([]);

    await expect(instance.writeFilesToProfile()).resolves.not.toThrow();
  });
});

describe('beforeLaunch', () => {
  test('should use provided userDataDir from options', async () => {
    const instance = Plugin();
    const customDir = '/custom/user/data/dir';
    const options = { userDataDir: customDir };

    await instance.beforeLaunch(options);

    expect((instance as any)._userDataDir).toBe(customDir);
    expect((instance as any)._isTemporary).toBe(false);
    expect(options.userDataDir).toBe(customDir);
  });

  test('should create temporary directory if userDataDir not provided', async () => {
    const instance = Plugin();
    const options = {};

    await instance.beforeLaunch(options);

    const userDataDir = (instance as any)._userDataDir;
    expect(userDataDir).toBeTruthy();
    expect(userDataDir).toContain('puppeteer_dev_profile-');
    expect((instance as any)._isTemporary).toBe(true);
    expect(options.userDataDir).toBe(userDataDir);

    // Cleanup
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('should write files to profile after setup', async () => {
    const fileContent = 'launch test';
    const fileName = 'launch.txt';
    const instance = Plugin({
      files: [{ target: 'Profile', file: fileName, contents: fileContent }],
    });
    const options = {};

    await instance.beforeLaunch(options);

    const userDataDir = (instance as any)._userDataDir;
    const filePath = path.join(userDataDir, 'Default', fileName);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(fileContent);

    // Cleanup
    if (fs.existsSync(userDataDir)) {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});

describe('onDisconnected', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-disconnect-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should delete directory when shouldDeleteDirectory is true', async () => {
    const instance = Plugin({ deleteTemporary: true });
    (instance as any)._userDataDir = tempDir;
    (instance as any)._isTemporary = true;

    expect(fs.existsSync(tempDir)).toBe(true);

    await instance.onDisconnected();

    // Wait for async deletion
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(fs.existsSync(tempDir)).toBe(false);
  });

  test('should not delete directory when shouldDeleteDirectory is false', async () => {
    const instance = Plugin({ deleteTemporary: false });
    (instance as any)._userDataDir = tempDir;
    (instance as any)._isTemporary = true;

    expect(fs.existsSync(tempDir)).toBe(true);

    await instance.onDisconnected();

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(fs.existsSync(tempDir)).toBe(true);
  });

  test('should delete existing directory when deleteExisting is true', async () => {
    const instance = Plugin({ deleteExisting: true });
    (instance as any)._userDataDir = tempDir;
    (instance as any)._isTemporary = false;

    expect(fs.existsSync(tempDir)).toBe(true);

    await instance.onDisconnected();

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(fs.existsSync(tempDir)).toBe(false);
  });
});
