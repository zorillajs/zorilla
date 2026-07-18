import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEFAULT_PLUGIN_SCOPE = '@zorilla';
const PLUGIN_PREFIX = 'puppeteer-extra-plugin-';

interface PnpApi {
  resolveRequest(request: string, issuer: string): string | null;
}

export interface ResolveDependencyImportPathOptions {
  issuerUrl?: string;
  pnpApi?: PnpApi;
}

export function resolveDependencyPackageName(name: string): string {
  if (name.includes(PLUGIN_PREFIX)) {
    return name;
  }

  if (name.startsWith('@')) {
    const [scope, packageName, ...subpath] = name.split('/');
    if (!scope || !packageName) {
      return name;
    }
    const normalizedPackageName = packageName.startsWith(PLUGIN_PREFIX)
      ? packageName
      : `${PLUGIN_PREFIX}${packageName}`;
    return [scope, normalizedPackageName, ...subpath].join('/');
  }

  return `${DEFAULT_PLUGIN_SCOPE}/${PLUGIN_PREFIX}${name}`;
}

export function extractDependencyPackageName(name: string): string {
  const resolvedName = resolveDependencyPackageName(name);
  const parts = resolvedName.split('/');

  if (resolvedName.startsWith('@')) {
    const [scope, packageName] = parts;
    return scope && packageName ? `${scope}/${packageName}` : resolvedName;
  }

  return parts[0] || resolvedName;
}

export function resolveDependencyImportPath(
  name: string,
  opts: ResolveDependencyImportPathOptions = {}
): string {
  const resolvedName = resolveDependencyPackageName(name);
  const pnpApi = opts.pnpApi || getPnpApi();
  const issuerPath = opts.issuerUrl ? urlToPath(opts.issuerUrl) : undefined;

  if (pnpApi && issuerPath) {
    const resolvedPath = pnpApi.resolveRequest(resolvedName, issuerPath);
    if (resolvedPath) {
      return pathToFileURL(resolvedPath).href;
    }
  }

  // Resolve from the plugin that declared the dependency. This matters for
  // strict node_modules layouts such as pnpm, where the dependency is visible
  // from the declaring plugin but not necessarily from puppeteer-extra.
  if (issuerPath) {
    try {
      return pathToFileURL(
        createRequire(opts.issuerUrl || issuerPath).resolve(resolvedName)
      ).href;
    } catch {
      // Fall through to the workspace/bare-specifier compatibility paths.
    }
  }

  // In Plug'n'Play environments (like Yarn PnP), bypass relative path rewriting
  // and rely on the package manager's strict resolution mechanism instead.
  if (
    !resolvedName.startsWith(`${DEFAULT_PLUGIN_SCOPE}/${PLUGIN_PREFIX}`) ||
    process.versions.pnp
  ) {
    return resolvedName;
  }

  const withoutScope = resolvedName.replace(`${DEFAULT_PLUGIN_SCOPE}/`, '');
  const [packageName, ...subpath] = withoutScope.split('/');
  const resolvedSubpath = subpath.join('/');

  const relativePath = resolvedSubpath
    ? `../../${packageName}/dist/${resolvedSubpath}/index.js`
    : `../../${packageName}/dist/index.js`;

  return new URL(relativePath, import.meta.url).href;
}

function getPnpApi(): PnpApi | undefined {
  if (!process.versions.pnp) {
    return undefined;
  }

  try {
    return createRequire(import.meta.url)('pnpapi') as PnpApi;
  } catch {
    return undefined;
  }
}

function urlToPath(urlOrPath: string): string {
  return urlOrPath.startsWith('file://') ? fileURLToPath(urlOrPath) : urlOrPath;
}
