---
"@zorilla/puppeteer-extra": patch
---

Fix plugin dependency imports under Yarn Plug'n'Play by preserving bare package specifiers instead of rewriting Zorilla workspace packages to relative `dist` paths.
