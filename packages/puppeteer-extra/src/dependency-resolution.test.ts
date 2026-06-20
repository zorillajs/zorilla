<<<<<<< HEAD
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import {
  extractDependencyPackageName,
  resolveDependencyImportPath,
  resolveDependencyPackageName,
} from './dependency-resolution.js';

describe('dependency resolution helpers', () => {
  afterEach(() => {
    delete (process.versions as Record<string, string | undefined>).pnp;
  });

  it('adds the zorilla scope to unscoped plugin dependencies', () => {
    expect(resolveDependencyPackageName('user-preferences')).toBe(
      '@zorilla/puppeteer-extra-plugin-user-preferences'
    );
  });

  it('preserves scoped stealth evasion dependencies', () => {
    expect(resolveDependencyPackageName('stealth/evasions/chrome.app')).toBe(
      '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.app'
    );
  });

  it('keeps already-scoped plugin package names intact', () => {
    expect(
      resolveDependencyPackageName(
        '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.app'
      )
    ).toBe('@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.app');
  });

  it('adds the plugin prefix after an arbitrary scope', () => {
    expect(
      resolveDependencyPackageName('@acme/custom-plugin/evasions/foo')
    ).toBe('@acme/puppeteer-extra-plugin-custom-plugin/evasions/foo');
  });

  it('extracts the install package name for scoped dependencies', () => {
    expect(extractDependencyPackageName('stealth/evasions/chrome.app')).toBe(
      '@zorilla/puppeteer-extra-plugin-stealth'
    );
  });

  it('resolves workspace import paths for zorilla plugin dependencies', () => {
    expect(
      fileURLToPath(resolveDependencyImportPath('stealth/evasions/chrome.app'))
    ).toBe(
      fileURLToPath(
        new URL(
          '../../puppeteer-extra-plugin-stealth/dist/evasions/chrome.app/index.js',
          import.meta.url
        )
      )
    );
  });

  it('keeps zorilla plugin dependencies as bare import paths under Yarn PnP', () => {
    Object.defineProperty(process.versions, 'pnp', {
      configurable: true,
      value: '1',
    });

    expect(resolveDependencyImportPath('stealth/evasions/chrome.app')).toBe(
      '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.app'
    );
  });

  it('resolves dependencies from the declaring plugin under Plug and Play', () => {
    const resolvedPath =
      '/virtual/@zorilla/puppeteer-extra-plugin-user-preferences/dist/index.js';
    const calls: Array<[string, string]> = [];

    const importPath = resolveDependencyImportPath('user-preferences', {
      issuerUrl:
        'file:///virtual/@zorilla/puppeteer-extra-plugin-stealth/dist/evasions/user-agent-override/index.js',
      pnpApi: {
        resolveRequest(request, issuer) {
          calls.push([request, issuer]);
          return resolvedPath;
        },
      },
    });

    expect(importPath).toBe(pathToFileURL(resolvedPath).href);
    expect(calls).toEqual([
      [
        '@zorilla/puppeteer-extra-plugin-user-preferences',
        '/virtual/@zorilla/puppeteer-extra-plugin-stealth/dist/evasions/user-agent-override/index.js',
      ],
    ]);
  });

  it('keeps non-zorilla scoped dependencies as bare import paths', () => {
    expect(
      resolveDependencyImportPath('@acme/puppeteer-extra-plugin-custom-plugin')
    ).toBe('@acme/puppeteer-extra-plugin-custom-plugin');
  });
});
