# chrome.app

## Detection Technique

The `window.chrome.app` object is a Chrome-specific API that provides information about installed Chrome apps. In headful Chrome, this object always exists with specific properties and methods, but in headless mode the entire `window.chrome` object or the `chrome.app` property is missing, making it a clear indicator of automation.

**What Servers/Clients Check:**
- `window.chrome` existence - Missing in headless mode
- `window.chrome.app` existence - Missing in headless Chrome
- `chrome.app.isInstalled` property - Should return `false` for regular web pages
- `chrome.app.getDetails()` method - Should exist and return `null` for non-app pages
- `chrome.app.getIsInstalled()` method - Should return `false`
- `chrome.app.runningState()` method - Should return `'cannot_run'`
- Static properties like `InstallState` and `RunningState` enums

**Browser Behavior:**
- **Real Chrome:**
  - `window.chrome` object exists
  - `chrome.app` object exists with full API
  - Methods throw proper `TypeError` with specific messages when called incorrectly
  - All methods have proper `toString()` output
- **Headless Chrome (Without Evasion):**
  - `window.chrome` object may be missing entirely
  - `chrome.app` property doesn't exist
  - Easy to detect with simple existence check

**Why This Matters:**
This is a MEDIUM severity detection method. While not as critical as `navigator.webdriver`, the absence of `chrome.app` is suspicious since it exists in all real Chrome browsers, even when viewing regular web pages (not Chrome apps). Detection scripts often check for multiple Chrome-specific APIs, and missing `chrome.app` contributes to an automation fingerprint.

## How This Evasion Works

This evasion creates a fully functional mock of the `chrome.app` API with accurate static data, proper method behavior, and correct error handling that matches real Chrome.

### Key Components

**1. Chrome Object Creation**
If `window.chrome` doesn't exist, create it with the exact property descriptor used in real Chrome:
```javascript
Object.defineProperty(window, 'chrome', {
  writable: true,
  enumerable: true,
  configurable: false, // Important - matches real Chrome
  value: {}
})
```

**2. Static Data Structure**
The `chrome.app` object includes constant data that doesn't change:
```javascript
{
  "isInstalled": false,
  "InstallState": {
    "DISABLED": "disabled",
    "INSTALLED": "installed",
    "NOT_INSTALLED": "not_installed"
  },
  "RunningState": {
    "CANNOT_RUN": "cannot_run",
    "READY_TO_RUN": "ready_to_run",
    "RUNNING": "running"
  }
}
```

**3. Functional Methods**
Each method validates arguments and throws appropriate errors:
- `getDetails()` - Returns `null` (page is not a Chrome app)
- `getIsInstalled()` - Returns `false` (page is not installed as an app)
- `runningState()` - Returns `'cannot_run'` (page cannot run as an app)

**4. Error Handling**
Methods throw accurate `TypeError` messages when called with arguments:
```javascript
getDetails: function getDetails() {
  if (arguments.length) {
    throw new TypeError(`Error in invocation of app.getDetails()`)
  }
  return null
}
```

**5. toString() Patching**
All methods are patched to return native-like `toString()` output using `utils.patchToStringNested()`.

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Injects the chrome.app mock

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument(utils => {
    // Create window.chrome if it doesn't exist
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {}
      })
    }

    // Skip if chrome.app already exists (headful mode)
    if ('app' in window.chrome) {
      return
    }

    // Create chrome.app with static data and methods
    window.chrome.app = {
      ...STATIC_DATA,
      get isInstalled() {
        return false
      },
      getDetails: function getDetails() {
        if (arguments.length) {
          throw new TypeError(`Error in invocation of app.getDetails()`)
        }
        return null
      },
      // ... other methods
    }

    // Patch toString() for all methods
    utils.patchToStringNested(window.chrome.app)
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import ChromeApp from '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.app'

puppeteer.use(ChromeApp())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify chrome.app exists and works correctly
const appData = await page.evaluate(() => ({
  exists: 'chrome' in window && 'app' in window.chrome,
  isInstalled: window.chrome?.app?.isInstalled,
  getDetails: window.chrome?.app?.getDetails(),
  getIsInstalled: window.chrome?.app?.getIsInstalled(),
  runningState: window.chrome?.app?.runningState(),
  hasEnums: !!(window.chrome?.app?.InstallState && window.chrome?.app?.RunningState)
}))

console.log('chrome.app exists:', appData.exists) // true
console.log('isInstalled:', appData.isInstalled) // false
console.log('getDetails():', appData.getDetails) // null
console.log('getIsInstalled():', appData.getIsInstalled) // false
console.log('runningState():', appData.runningState) // 'cannot_run'
console.log('Has enums:', appData.hasEnums) // true

// Verify error handling
const errorTest = await page.evaluate(() => {
  try {
    window.chrome.app.getDetails('invalid argument')
    return 'No error thrown'
  } catch (err) {
    return err.message
  }
})
console.log('Error message:', errorTest) // "Error in invocation of app.getDetails()"
```

## Testing

Test the evasion against detection services:
- https://bot.sannysoft.com - Should show chrome.app as present
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass chrome.app checks

**Manual Test in DevTools:**
```javascript
// Check chrome.app exists
console.log('chrome' in window) // true
console.log('app' in window.chrome) // true

// Check methods work correctly
console.log(chrome.app.getDetails()) // null
console.log(chrome.app.getIsInstalled()) // false
console.log(chrome.app.runningState()) // "cannot_run"

// Check static data
console.log(chrome.app.InstallState)
// {DISABLED: "disabled", INSTALLED: "installed", NOT_INSTALLED: "not_installed"}

console.log(chrome.app.RunningState)
// {CANNOT_RUN: "cannot_run", READY_TO_RUN: "ready_to_run", RUNNING: "running"}

// Check error handling
try {
  chrome.app.getDetails('argument')
} catch (err) {
  console.log(err.message) // "Error in invocation of app.getDetails()"
}

// Check toString() is native-like
console.log(chrome.app.getDetails.toString())
// "function getDetails() { [native code] }"
```

## Chrome Apps Context

**What are Chrome Apps?**
Chrome Apps were installable web applications that ran in Chrome with enhanced permissions and offline capabilities. Google deprecated Chrome Apps in 2020, but the API remains in the browser for backward compatibility.

**Why does the API exist on regular web pages?**
Even though most websites aren't Chrome Apps, the `chrome.app` API is exposed globally in Chrome. For regular web pages:
- `isInstalled` returns `false`
- `getDetails()` returns `null`
- `runningState()` returns `'cannot_run'`

The API exists but indicates the page is not an installed app.

## References

- [Chrome Apps API Documentation](https://developer.chrome.com/docs/apps/app_runtime/) (Deprecated)
- [Chrome Apps Deprecation Announcement](https://blog.chromium.org/2020/08/changes-to-chrome-app-support-timeline.html)
- [MDN: Chrome Apps](https://developer.mozilla.org/en-US/docs/Web/API/Chrome)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Mock the `chrome.app` object if not available (e.g. when running headless).

**Options:**
- `opts` (optional, default `{}`)
