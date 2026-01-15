# navigator.webdriver

## Detection Technique

The `navigator.webdriver` property is the most direct and obvious automation detection flag in modern browsers. It's a read-only property that indicates whether the browser is being controlled by automation software like Puppeteer, Playwright, or Selenium.

**What Servers/Clients Check:**
- Direct property access: `navigator.webdriver === true` reveals automation
- Property existence: `'webdriver' in navigator` can detect even `false` values
- Property descriptor inspection: Checking if property is explicitly defined

**Browser Behavior:**
- **Real Chrome:** Property doesn't exist (`undefined`)
- **Pre-Chrome 88 Automation:** Property is `true`
- **Chrome 88+ Automation:** Property is `false` (still detectable as explicitly set)
- **Chrome 89+ with flag:** Property can be properly hidden (`undefined`)

**Why This Matters:**
This is a CRITICAL severity detection method. Almost every bot protection service checks this property first, as it's the W3C WebDriver standard for automation detection. Failing to hide this will result in immediate bot detection on most protected sites.

## How This Evasion Works

This evasion uses a two-pronged approach to completely hide the webdriver property:

### 1. Property Deletion (All Chrome Versions)
```javascript
delete Object.getPrototypeOf(navigator).webdriver
```

Removes the property from the Navigator prototype chain, making it `undefined` when accessed.

### 2. Blink Feature Disabling (Chrome 89+)
```javascript
options.args.push('--disable-blink-features=AutomationControlled')
```

Prevents Chrome from setting the property at all by disabling the `AutomationControlled` Blink feature. This is more robust than property deletion since it prevents Chrome from creating the property in the first place.

**Flag Merging Logic:**
The evasion intelligently merges with existing `--disable-blink-features` flags:
```javascript
// If user already has --disable-blink-features=A,B
// Result: --disable-blink-features=A,B,AutomationControlled
```

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Deletes the property via page evaluation
- `beforeLaunch(options)` - Adds launch flag for Chrome 89+

**Key Code:**
```javascript
async onPageCreated(page) {
  await withUtils(this, page).evaluateOnNewDocument(() => {
    delete Object.getPrototypeOf(navigator).webdriver
  })
}

async beforeLaunch(options) {
  // Add --disable-blink-features=AutomationControlled
  options.args = options.args || []

  // Find existing --disable-blink-features flag
  const index = options.args.findIndex(arg =>
    arg.startsWith('--disable-blink-features=')
  )

  if (index !== -1) {
    // Merge with existing features
    const value = options.args[index].split('=')[1]
    options.args[index] = `--disable-blink-features=${value},AutomationControlled`
  } else {
    // Add new flag
    options.args.push('--disable-blink-features=AutomationControlled')
  }
}
```

## Known Issues

### Linux Infobar Warning

On Linux, the `--disable-blink-features=AutomationControlled` flag can trigger a Chrome infobar warning:

> "You are using an unsupported command-line flag: --disable-blink-features=AutomationControlled. Stability and security will suffer."

**Workarounds:**
1. Use headful mode and disable the flag (property deletion still works)
2. Accept the infobar (doesn't affect functionality)
3. Use `--disable-infobars` flag (deprecated but may still work)

**Discussion:** https://github.com/puppeteer/puppeteer/issues/7350

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import NavigatorWebdriver from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.webdriver'

puppeteer.use(NavigatorWebdriver())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify the property is hidden
const webdriver = await page.evaluate(() => navigator.webdriver)
console.log('navigator.webdriver:', webdriver) // undefined

const hasProperty = await page.evaluate(() => 'webdriver' in navigator)
console.log('Has property:', hasProperty) // false
```

## Testing

Test against detection services:
- https://bot.sannysoft.com - Should show green for "navigator.webdriver"
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass webdriver check

## References

- [W3C WebDriver Specification](https://www.w3.org/TR/webdriver/#dom-navigatorautomationinformation-webdriver)
- [Chromium Issue 1074564](https://bugs.chromium.org/p/chromium/issues/detail?id=1074564) - AutomationControlled feature
- [MDN: Navigator.webdriver](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/webdriver)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Pass the Webdriver Test. Will delete `navigator.webdriver` property and add launch flag to prevent it being set.

**Options:**
- `opts` (optional, default `{}`)
