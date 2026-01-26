---
"@zorilla/playwright-extra": patch
---

Fix Playwright version mismatch that caused CI test failures

- Update @playwright/test to match playwright version (1.58.0)
- Both packages must be the same version to work correctly
- Add renovate.json to group Playwright packages for future updates
