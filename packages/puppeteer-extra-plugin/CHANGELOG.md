# @zorilla/puppeteer-extra-plugin

## 2.0.1

### Patch Changes

- [#129](https://github.com/zorillajs/zorilla/pull/129) [`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Use the scoped Zorilla framework packages for optional plugin peer dependencies so
  package managers do not install the upstream `puppeteer-extra` or
  `playwright-extra` packages.
- Updated dependencies [[`2d35891`](https://github.com/zorillajs/zorilla/commit/2d35891f07b8d72831197db8d1e411fc3d17d835)]:
  - @zorilla/puppeteer-extra@2.0.2
  - @zorilla/playwright-extra@2.0.0

## 2.0.0

### Major Changes

- [#104](https://github.com/zorillajs/zorilla/pull/104) [`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Drop support for Node.js 20 and require Node.js 22 or newer.

### Patch Changes

- [#105](https://github.com/zorillajs/zorilla/pull/105) [`7df2df0`](https://github.com/zorillajs/zorilla/commit/7df2df0a586c69c3958c2fd3941f2b402cdcc448) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Resolve auto-loaded plugin dependencies from the plugin that declared them so Yarn Plug'n'Play can load nested stealth dependencies without requiring extra top-level peer installs.

## 1.0.2

### Patch Changes

- [#31](https://github.com/zorillajs/zorilla/pull/31) [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Update documentation across all packages to use correct `@zorilla` scoped package names in installation instructions, titles, and npm badges. Also fix GitHub workflow status badges to point to the `main` branch instead of `master`.

## 1.0.1

### Patch Changes

- [#11](https://github.com/zorillajs/zorilla/pull/11) [`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Basic misc fixes to get the project functional.
