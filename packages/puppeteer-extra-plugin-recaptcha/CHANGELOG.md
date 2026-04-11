# @zorilla/puppeteer-extra-plugin-recaptcha

## 1.0.2

### Patch Changes

- [#31](https://github.com/zorillajs/zorilla/pull/31) [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Fix module augmentation not working for TypeScript users. The build script now properly copies `.d.ts` files to the dist directory and injects triple-slash references, ensuring that TypeScript users get proper autocompletion for methods like `page.solveRecaptchas()`.

  Also modernized the 2captcha-api.ts code by converting 38 `var` declarations to `let`/`const`, and reorganized tests into a dedicated `tests/` directory.

- Updated dependencies [[`e6da83f`](https://github.com/zorillajs/zorilla/commit/e6da83f12a79e6710e10a9890e505b8dae2905e9), [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42)]:
  - @zorilla/puppeteer-extra@1.0.2
  - @zorilla/playwright-extra@1.0.3
  - @zorilla/puppeteer-extra-plugin@1.0.2

## 1.0.1

### Patch Changes

- [#11](https://github.com/zorillajs/zorilla/pull/11) [`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Basic misc fixes to get the project functional.

- Updated dependencies [[`e03e017`](https://github.com/zorillajs/zorilla/commit/e03e017bdff78d16d4f01289a0e1054d2edee0b4)]:
  - @zorilla/puppeteer-extra-plugin@1.0.1
