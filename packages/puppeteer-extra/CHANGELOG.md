# @zorilla/puppeteer-extra

## 2.0.1

### Patch Changes

- [#112](https://github.com/zorillajs/zorilla/pull/112) [`5c43dc0`](https://github.com/zorillajs/zorilla/commit/5c43dc0d37abe49df0f03c31df683638016070dc) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Fix plugin type compatibility when package managers load plugin packages through separate base-plugin instances.

- [#121](https://github.com/zorillajs/zorilla/pull/121) [`b25d34e`](https://github.com/zorillajs/zorilla/commit/b25d34e87a6cf2c8fb20e5fe12ee3e676737ea56) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Resolve plugin dependencies from the package that declared them so nested stealth dependencies load under pnpm's strict node_modules layout.

## 2.0.0

### Major Changes

- [#104](https://github.com/zorillajs/zorilla/pull/104) [`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Drop support for Node.js 20 and require Node.js 22 or newer.

### Patch Changes

- [#92](https://github.com/zorillajs/zorilla/pull/92) [`6d055e2`](https://github.com/zorillajs/zorilla/commit/6d055e20d97e96ede0fd0d6768aa2404e7636f40) Thanks [@rtritto](https://github.com/rtritto)! - Fix plugin dependency imports under Yarn Plug'n'Play by preserving bare package specifiers instead of rewriting Zorilla workspace packages to relative `dist` paths.

- [#105](https://github.com/zorillajs/zorilla/pull/105) [`7df2df0`](https://github.com/zorillajs/zorilla/commit/7df2df0a586c69c3958c2fd3941f2b402cdcc448) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Resolve auto-loaded plugin dependencies from the plugin that declared them so Yarn Plug'n'Play can load nested stealth dependencies without requiring extra top-level peer installs.

- [#88](https://github.com/zorillajs/zorilla/pull/88) [`f49407e`](https://github.com/zorillajs/zorilla/commit/f49407e97b9aa06852c458c811f63ebf8bf41870) Thanks [@renovate](https://github.com/apps/renovate)! - Add compatibility with Puppeteer 25's async default argument and executable path APIs.

## 1.0.2

### Patch Changes

- [#60](https://github.com/zorillajs/zorilla/pull/60) [`e6da83f`](https://github.com/zorillajs/zorilla/commit/e6da83f12a79e6710e10a9890e505b8dae2905e9) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Preserve scoped plugin package names during dependency resolution and add regression coverage for stealth evasion imports such as `stealth/evasions/chrome.app`.

- [#31](https://github.com/zorillajs/zorilla/pull/31) [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Update documentation across all packages to use correct `@zorilla` scoped package names in installation instructions, titles, and npm badges. Also fix GitHub workflow status badges to point to the `main` branch instead of `master`.

## 1.0.1

### Patch Changes

- [#11](https://github.com/zorillajs/zorilla/pull/11) [`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Basic misc fixes to get the project functional.
