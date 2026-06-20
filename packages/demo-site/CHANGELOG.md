# @zorilla/demo-site

## 1.1.3

### Patch Changes

- Updated dependencies [[`bdc2f6d`](https://github.com/zorillajs/zorilla/commit/bdc2f6dae9710448b78f092bcd5ce3e526c65650), [`6d055e2`](https://github.com/zorillajs/zorilla/commit/6d055e20d97e96ede0fd0d6768aa2404e7636f40), [`7df2df0`](https://github.com/zorillajs/zorilla/commit/7df2df0a586c69c3958c2fd3941f2b402cdcc448), [`f49407e`](https://github.com/zorillajs/zorilla/commit/f49407e97b9aa06852c458c811f63ebf8bf41870)]:
  - @zorilla/playwright-extra@2.0.0
  - @zorilla/puppeteer-extra@2.0.0
  - @zorilla/puppeteer-extra-plugin-stealth@2.0.0

## 1.1.2

### Patch Changes

- Updated dependencies [[`b6933f2`](https://github.com/zorillajs/zorilla/commit/b6933f28277f2daef8c23e94bd19f7e486015629)]:
  - @zorilla/puppeteer-extra-plugin-stealth@1.0.4
  - @zorilla/playwright-extra@1.0.3

## 1.1.1

### Patch Changes

- Updated dependencies [[`a414e33`](https://github.com/zorillajs/zorilla/commit/a414e33dd236db995fd8cb40b0955851953eaddb), [`e6da83f`](https://github.com/zorillajs/zorilla/commit/e6da83f12a79e6710e10a9890e505b8dae2905e9), [`4c37634`](https://github.com/zorillajs/zorilla/commit/4c37634704c8f412e97d90a54d810cbd6aa38c42)]:
  - @zorilla/puppeteer-extra-plugin-stealth@1.0.3
  - @zorilla/puppeteer-extra@1.0.2
  - @zorilla/playwright-extra@1.0.3

## 1.1.0

### Minor Changes

- [#16](https://github.com/zorillajs/zorilla/pull/16) [`03c5dee`](https://github.com/zorillajs/zorilla/commit/03c5deedc81be8914b0e193e3d16731f89cbca15) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Add demo site and comprehensive evasion documentation

  - Created Cloudflare Worker demo site with 15 bot detection tests
  - Wrote comprehensive documentation for all 17 stealth evasions
  - Added code samples, demo scripts, and testing instructions

### Patch Changes

- [#25](https://github.com/zorillajs/zorilla/pull/25) [`a824129`](https://github.com/zorillajs/zorilla/commit/a824129591557e677f86da23a3b5bf92c61ee270) Thanks [@JustinBeckwith](https://github.com/JustinBeckwith)! - Migrate demo-site templates from strings to Hono with JSX

  - Replace TypeScript string templates with proper JSX components
  - Add Hono framework for cleaner routing and better developer experience
  - Rename /api/secret route to /challenge for clarity
  - Configure TypeScript for JSX support with full type safety

- Updated dependencies [[`03c5dee`](https://github.com/zorillajs/zorilla/commit/03c5deedc81be8914b0e193e3d16731f89cbca15), [`5e89046`](https://github.com/zorillajs/zorilla/commit/5e8904674dd41d54180384d1c3a8ea5f3afcf220), [`4967570`](https://github.com/zorillajs/zorilla/commit/4967570ed5073b5fa068583b2f599d71c829c80a)]:
  - @zorilla/puppeteer-extra-plugin-stealth@1.0.2
  - @zorilla/playwright-extra@1.0.2
