---
'@zorilla/proxy-router': patch
'@zorilla/puppeteer-extra-plugin': patch
'@zorilla/puppeteer-extra-plugin-adblocker': patch
'@zorilla/puppeteer-extra-plugin-anonymize-ua': patch
'@zorilla/puppeteer-extra-plugin-block-resources': patch
'@zorilla/puppeteer-extra-plugin-click-and-wait': patch
'@zorilla/puppeteer-extra-plugin-devtools': patch
'@zorilla/puppeteer-extra-plugin-flash': patch
'@zorilla/puppeteer-extra-plugin-font-size': patch
'@zorilla/puppeteer-extra-plugin-recaptcha': patch
'@zorilla/puppeteer-extra-plugin-repl': patch
'@zorilla/puppeteer-extra-plugin-stealth': patch
'@zorilla/puppeteer-extra-plugin-user-data-dir': patch
'@zorilla/puppeteer-extra-plugin-user-preferences': patch
---

Use the scoped Zorilla framework packages for optional plugin peer dependencies so
package managers do not install the upstream `puppeteer-extra` or
`playwright-extra` packages.
