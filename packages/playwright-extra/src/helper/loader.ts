import { createRequire } from 'node:module';
import type * as pw from 'playwright-core';

const require = createRequire(import.meta.url);

/** Node.js module loader helper */
export class Loader<TargetModule> {
  constructor(
    public moduleName: string,
    public packageNames: string[]
  ) {}

  /**
   * Lazy load a top level export from another module by wrapping it in a JS proxy.
   *
   * This allows us to re-export e.g. `devices` from `playwright` while redirecting direct calls
   * to it to the module version the user has installed, rather than shipping with a hardcoded version.
   *
   * If we don't do this and the user doesn't have the target module installed we'd throw immediately when our code is imported.
   *
   * We use a "super" Proxy defining all traps, so calls like `Object.keys(playwright.devices).length` will return the correct value.
   */
  public lazyloadExportOrDie<T extends keyof TargetModule>(exportName: T) {
    const trapHandler = Object.fromEntries(
      Object.getOwnPropertyNames(Reflect).map((name: string) => [
        name,
        (target: object, ...args: unknown[]) => {
          const moduleExport = this.loadModuleOrDie()[exportName];
          const customTarget = moduleExport as object;
          const reflectMethod = Reflect[name as keyof typeof Reflect] as (
            ...args: unknown[]
          ) => unknown;
          const result = reflectMethod(customTarget || target, ...args);
          return result;
        },
      ])
    );
    return new Proxy({}, trapHandler) as TargetModule[T];
  }

  /** Load the module if possible */
  public loadModule() {
    return requirePackages<TargetModule>(this.packageNames);
  }

  /** Load the module if possible or throw */
  public loadModuleOrDie(): TargetModule {
    const module = requirePackages<TargetModule>(this.packageNames);
    if (module) {
      return module;
    }
    throw this.requireError;
  }

  public get requireError() {
    const moduleNamePretty =
      this.moduleName.charAt(0).toUpperCase() + this.moduleName.slice(1);
    return new Error(`
  ${moduleNamePretty} is missing. :-)

  I've tried loading ${this.packageNames
    .map(p => `"${p}"`)
    .join(', ')} - no luck.

  Make sure you install one of those packages or use the named 'addExtra' export,
  to patch a specific (and maybe non-standard) implementation of ${moduleNamePretty}.

  To get the latest stable version of ${moduleNamePretty} run:
  'npm i ${this.moduleName}'
  `);
  }
}

export function requirePackages<TargetModule = unknown>(
  packageNames: string[]
): TargetModule | undefined {
  for (const name of packageNames) {
    try {
      return require(name) as TargetModule;
    } catch {
      // Silently ignore - will try import() next
    }
  }
  return undefined;
}

export async function importPackages<TargetModule = unknown>(
  packageNames: string[]
): Promise<TargetModule | undefined> {
  for (const name of packageNames) {
    try {
      const module = await import(name);
      // ESM modules have a default export - use it if available
      return (module.default || module) as TargetModule;
    } catch (err) {
      // Debug: log import errors to help diagnose issues
      if (process.env.DEBUG?.includes('playwright-extra')) {
        console.log(`Failed to import "${name}":`, (err as Error).message);
      }
    }
  }
  return undefined;
}

/** Playwright specific module loader */
export const playwrightLoader = new Loader<typeof pw>('playwright', [
  'playwright-core',
  'playwright',
]);
