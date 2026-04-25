# @zorilla/puppeteer-extra-plugin-adblocker

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
