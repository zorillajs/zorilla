const DEFAULT_PLUGIN_SCOPE = '@zorilla';
const PLUGIN_PREFIX = 'puppeteer-extra-plugin-';

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

export function resolveDependencyImportPath(name: string): string {
  const resolvedName = resolveDependencyPackageName(name);

  if (
    !resolvedName.startsWith(`${DEFAULT_PLUGIN_SCOPE}/${PLUGIN_PREFIX}`)
    // In Plug'n'Play environments (like Yarn PnP), bypass relative path rewriting
    // and rely on the package manager's strict resolution mechanism instead.
    || process?.versions?.pnp
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
