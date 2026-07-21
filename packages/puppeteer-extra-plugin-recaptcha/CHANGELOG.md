# @zorilla/puppeteer-extra-plugin-recaptcha

## 2.0.1

### Patch Changes

- [#129](https://github.com/zorillajs/zorilla/pull/129) [`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Use the scoped Zorilla framework packages for optional plugin peer dependencies so
  package managers do not install the upstream `puppeteer-extra` or
  `playwright-extra` packages.
- Updated dependencies [[`152bd6d`](https://github.com/zorillajs/zorilla/commit/152bd6d431d6ab53effc1bfaaa41ab8bc031113e), [`2d35891`](https://github.com/zorillajs/zorilla/commit/2d35891f07b8d72831197db8d1e411fc3d17d835)]:
  - @zorilla/puppeteer-extra-plugin@2.0.1
  - @zorilla/puppeteer-extra@2.0.2
  - @zorilla/playwright-extra@2.0.0

## 2.0.0

### Major Changes

- [#104](https://github.com/zorillajs/zorilla/pull/104) [`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Drop support for Node.js 20 and require Node.js 22 or newer.

### Patch Changes

- Updated dependencies [[`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650), [`6d055e2`](https://github.com/zorillajs/zorilla/commit/6d055e20d97e96ede0fd0d6768aa2404e7636f40), [`7df2df0`](https://github.com/zorillajs/zorilla/commit/7df2df0a586c69c3958c2fd3941f2b402cdcc448), [`f49407e`](https://github.com/zorillajs/zorilla/commit/f49407e97b9aa06852c458c811f63ebf8bf41870)]:
  - @zorilla/playwright-extra@2.0.0
  - @zorilla/puppeteer-extra@2.0.0
  - @zorilla/puppeteer-extra-plugin@2.0.0

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
