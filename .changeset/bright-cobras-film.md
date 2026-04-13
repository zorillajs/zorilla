---
'@zorilla/puppeteer-extra-plugin-adblocker': patch
---

Move the default serialized adblocker cache out of the OS temp directory and
into a user-specific cache location to avoid insecure temporary file creation.
