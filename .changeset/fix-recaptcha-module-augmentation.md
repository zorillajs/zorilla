---
"@zorilla/puppeteer-extra-plugin-recaptcha": patch
---

Fix module augmentation not working for TypeScript users. The build script now properly copies `.d.ts` files to the dist directory and injects triple-slash references, ensuring that TypeScript users get proper autocompletion for methods like `page.solveRecaptchas()`.

Also modernized the 2captcha-api.ts code by converting 38 `var` declarations to `let`/`const`, and reorganized tests into a dedicated `tests/` directory.
