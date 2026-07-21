# @zorilla/puppeteer-extra-plugin-stealth

## 2.0.1

### Patch Changes

- [#129](https://github.com/zorillajs/zorilla/pull/129) [`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Use the scoped Zorilla framework packages for optional plugin peer dependencies so
  package managers do not install the upstream `puppeteer-extra` or
  `playwright-extra` packages.
- Updated dependencies [[`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e), [`2d35891`](https://github.com/zorillajs/zorilla/commit/2d35891f07b8d72831197db8d1e411fc3d17d835)]:
  - @zorilla/puppeteer-extra-plugin@2.0.1
  - @zorilla/puppeteer-extra-plugin-user-preferences@2.0.1
  - @zorilla/puppeteer-extra@2.0.2
  - @zorilla/playwright-extra@2.0.0

## 2.0.0

### Major Changes

- [#104](https://github.com/zorillajs/zorilla/pull/104) [`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Drop support for Node.js 20 and require Node.js 22 or newer.

### Patch Changes

- Updated dependencies [[`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650), [`7df2df0`](https://github.com/zorillajs/zorilla/commit/7df2df0a586c69c3958c2fd3941f2b402cdcc448)]:
  - @zorilla/puppeteer-extra-plugin@2.0.0
  - @zorilla/puppeteer-extra-plugin-user-preferences@2.0.0

## 1.0.4

### Patch Changes

- [#65](https://github.com/zorillajs/zorilla/pull/65) [`b6933f2`](https://github.com/zorillajs/zorilla/commit/b6933f28277f2daef8c23e94bd19f7e486015629) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Fix the media.codecs parser to remove only the trailing wrapper quote, addressing a CodeQL sanitization alert without changing intended codec detection behavior.

## 1.0.3

### Patch Changes

- [#56](https://github.com/zorillajs/zorilla/pull/56) [`a414e33`](https://github.com/zorillajs/zorilla/commit/a414e33dd236db995fd8cb40b0955851953eaddb) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Convert the remaining automated stealth JS tests to TypeScript and add CI coverage for stealth test typechecking.

- [#31](https://github.com/zorillajs/zorilla/pull/31) [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Update documentation across all packages to use correct `@zorilla` scoped package names in installation instructions, titles, and npm badges. Also fix GitHub workflow status badges to point to the `main` branch instead of `master`.

- Updated dependencies [[`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42)]:
  - @zorilla/puppeteer-extra-plugin@1.0.2
  - @zorilla/puppeteer-extra-plugin-user-preferences@1.0.2

## 1.0.2

### Patch Changes

- [#16](https://github.com/zorillajs/zorilla/pull/16) [`03c5dee`](https://github.com/zorillajs/zorilla/commit/03c5deedc81be8914b0e193e3d16731f89cbca15) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Add demo site and comprehensive evasion documentation

  - Created Cloudflare Worker demo site with 15 bot detection tests
  - Wrote comprehensive documentation for all 17 stealth evasions
  - Added code samples, demo scripts, and testing instructions

- [#22](https://github.com/zorillajs/zorilla/pull/22) [`4967570`](https://github.com/zorillajs/zorilla/commit/4967570ed5073b5fa068583b2f599d71c829c80a) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Convert stealth plugin evasions to TypeScript

  - Converted all 24 JavaScript files in evasions directory to TypeScript
  - Added comprehensive type annotations throughout
  - Created browser API type augmentations
  - Improved type safety for proxy handlers and browser API mocking
  - No breaking changes or API modifications

## 1.0.1

### Patch Changes

- [#11](https://github.com/zorillajs/zorilla/pull/11) [`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Basic misc fixes to get the project functional.

- Updated dependencies [[`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4)]:
  - @zorilla/puppeteer-extra-plugin@1.0.1
  - @zorilla/puppeteer-extra-plugin-user-preferences@1.0.1
