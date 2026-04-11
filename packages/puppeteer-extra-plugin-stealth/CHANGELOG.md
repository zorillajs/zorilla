# @zorilla/puppeteer-extra-plugin-stealth

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
