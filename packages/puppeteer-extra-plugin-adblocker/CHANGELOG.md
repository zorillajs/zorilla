# @zorilla/puppeteer-extra-plugin-adblocker

## 2.0.1

### Patch Changes

- [#129](https://github.com/zorillajs/zorilla/pull/129) [`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Use the scoped Zorilla framework packages for optional plugin peer dependencies so
  package managers do not install the upstream `puppeteer-extra` or
  `playwright-extra` packages.
- Updated dependencies [[`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e), [`2d35891`](https://github.com/zorillajs/zorilla/commit/2d35891f07b8d72831197db8d1e411fc3d17d835)]:
  - @zorilla/puppeteer-extra-plugin@2.0.1
  - @zorilla/puppeteer-extra@2.0.2

## 2.0.0

### Major Changes

- [#104](https://github.com/zorillajs/zorilla/pull/104) [`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Drop support for Node.js 20 and require Node.js 22 or newer.

### Minor Changes

- [#96](https://github.com/zorillajs/zorilla/pull/96) [`9b18f63`](https://github.com/zorillajs/zorilla/commit/9b18f635208f64a68ff65312918f6270a5fb7d3c) Thanks [@rtritto](https://github.com/rtritto)! - Add support for custom adblock filter lists, including custom-only mode, optional merging with prebuilt lists, and cache separation by filter configuration.

### Patch Changes

- Updated dependencies [[`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650), [`7df2df0`](https://github.com/zorillajs/zorilla/commit/7df2df0a586c69c3958c2fd3941f2b402cdcc448)]:
  - @zorilla/puppeteer-extra-plugin@2.0.0

## 1.0.3

### Patch Changes

- [#67](https://github.com/zorillajs/zorilla/pull/67) [`c56da66`](https://github.com/zorillajs/zorilla/commit/c56da6654782c24ff55c4123dad06834ebcdc6b9) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Move the default serialized adblocker cache out of the OS temp directory and
  into a user-specific cache location to avoid insecure temporary file creation.

- [#76](https://github.com/zorillajs/zorilla/pull/76) [`d484fb2`](https://github.com/zorillajs/zorilla/commit/d484fb2080d7e6382d2af80e8382cc0209a416c6) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Replace the deprecated `@cliqz/adblocker-puppeteer` dependency with
  `@ghostery/adblocker-puppeteer` and refresh the lockfile to remove the retired
  `@cliqz/*` adblocker packages from the plugin dependency graph.

## 1.0.2

### Patch Changes

- [#31](https://github.com/zorillajs/zorilla/pull/31) [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Update documentation across all packages to use correct `@zorilla` scoped package names in installation instructions, titles, and npm badges. Also fix GitHub workflow status badges to point to the `main` branch instead of `master`.

- Updated dependencies [[`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42)]:
  - @zorilla/puppeteer-extra-plugin@1.0.2

## 1.0.1

### Patch Changes

- [#11](https://github.com/zorillajs/zorilla/pull/11) [`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Basic misc fixes to get the project functional.

- Updated dependencies [[`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4)]:
  - @zorilla/puppeteer-extra-plugin@1.0.1
