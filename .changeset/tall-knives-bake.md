---
"@zorilla/puppeteer-extra-plugin-stealth": patch
---

Fix the media.codecs parser to remove only the trailing wrapper quote, addressing a CodeQL sanitization alert without changing intended codec detection behavior.
