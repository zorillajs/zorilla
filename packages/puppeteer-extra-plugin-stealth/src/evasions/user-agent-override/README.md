# user-agent-override

## Detection Technique

The User Agent comprises multiple components: the UA string, Accept-Language header, platform property, and UA Client Hints. In headless Chrome, these can be inconsistent or reveal automation through missing headers, mismatched values, or platform discrepancies.

**What Servers/Clients Check:**
- User-Agent header consistency with navigator properties
- `Accept-Language` header presence (missing in headless)
- `navigator.platform` reflecting actual host OS (e.g., "Linux" on server)
- UA Client Hints (sec-ch-ua-*) matching user agent string
- Cross-validation of all UA components

**Browser Behavior:**
- **Real Chrome:**
  - Complete UA string without "HeadlessChrome"
  - `Accept-Language` header sent with requests
  - `navigator.platform` matches user's actual OS
  - UA Client Hints properly set
- **Headless Chrome (Without Evasion):**
  - UA contains "HeadlessChrome/" identifier
  - No `Accept-Language` header sent
  - `navigator.platform` reveals server OS (often "Linux")
  - Inconsistent or missing UA hints

**Why This Matters:**
This is a CRITICAL severity detection method. User Agent information is fundamental to browser fingerprinting. Inconsistencies between UA components are easily detectable and highly suspicious. The "HeadlessChrome" string is an immediate red flag, and missing Accept-Language is abnormal.

## How This Evasion Works

This comprehensive evasion fixes all User Agent components: UA string, Accept-Language header, platform, and UA Client Hints, ensuring complete consistency.

### Key Features

**1. Remove "HeadlessChrome" Identifier:**
```javascript
let ua = this.opts.userAgent ||
  (await page.browser().userAgent()).replace('HeadlessChrome/', 'Chrome/')
```

**2. Mask Linux Platform (Optional):**
```javascript
if (this.opts.maskLinux && ua.includes('Linux') && !ua.includes('Android')) {
  ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)')
}
```

**3. Set Accept-Language Header:**
- Headful mode: Sets via user preferences (proper header order)
- Headless mode: Sets via CDP Network.setUserAgentOverride

**4. Fix navigator.platform:**
Derives correct platform from UA string:
- Mac OS X → "MacIntel"
- Windows → "Win32"
- Linux → "Linux"
- Android → "Android"

**5. Generate UA Client Hints:**
Creates proper sec-ch-ua-* values:
```javascript
userAgentMetadata: {
  brands: _getBrands(),           // Brand list with GREASE
  fullVersion: uaVersion,         // Full Chrome version
  platform: _getPlatform(true),   // OS name
  platformVersion: _getPlatformVersion(),  // OS version
  architecture: _getPlatformArch(),        // CPU architecture
  model: _getPlatformModel(),     // Device model (mobile)
  mobile: _getMobile()            // Is mobile device
}
```

### Brand List with GREASE

UA Client Hints include a "GREASE" (Generate Random Extensions And Sustain Extensibility) brand to prevent ossification:

```javascript
const _getBrands = () => {
  const seed = uaVersion.split('.')[0] // Major version
  const order = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]][seed % 6]
  const escapedChars = [' ', ' ', ';']

  const greaseyBrand = `${escapedChars[order[0]]}Not${escapedChars[order[1]]}A${escapedChars[order[2]]}Brand`

  return [
    { brand: greaseyBrand, version: '99' },      // GREASE
    { brand: 'Chromium', version: seed },
    { brand: 'Google Chrome', version: seed }
  ]
}
```

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Sets user agent override via CDP
- `beforeLaunch(options)` - Detects if headless
- `beforeConnect()` - Treats connect() as headless

**Dependencies:**
- `user-preferences` plugin - For setting Accept-Language in headful mode

**Options:**
- `userAgent` (string) - Custom UA string (default: browser's UA with "Headless" removed)
- `locale` (string) - Language for Accept-Language header (default: `"en-US,en"`)
- `maskLinux` (boolean) - Replace Linux with Windows in UA (default: `true`)

**Key Implementation:**
```javascript
async onPageCreated(page) {
  // Get or build user agent string
  let ua = this.opts.userAgent ||
    (await page.browser().userAgent()).replace('HeadlessChrome/', 'Chrome/')

  // Mask Linux if needed
  if (this.opts.maskLinux && ua.includes('Linux') && !ua.includes('Android')) {
    ua = ua.replace(/\(([^)]+)\)/, '(Windows NT 10.0; Win64; x64)')
  }

  const uaVersion = ua.includes('Chrome/')
    ? ua.match(/Chrome\/([\d|.]+)/)[1]
    : (await page.browser().version()).match(/\/([\d|.]+)/)[1]

  const override = {
    userAgent: ua,
    platform: _getPlatform(),
    userAgentMetadata: {
      brands: _getBrands(),
      fullVersion: uaVersion,
      platform: _getPlatform(true),
      platformVersion: _getPlatformVersion(),
      architecture: _getPlatformArch(),
      model: _getPlatformModel(),
      mobile: _getMobile()
    }
  }

  // In headless, also override Accept-Language (not ideal for header order)
  if (this._headless) {
    override.acceptLanguage = this.opts.locale || 'en-US,en'
  }

  const client = typeof page._client === 'function' ? page._client() : page._client
  client.send('Network.setUserAgentOverride', override)
}

// Provide data for user-preferences plugin (headful mode)
get data() {
  return [{
    name: 'userPreferences',
    value: {
      intl: { accept_languages: this.opts.locale || 'en-US,en' }
    }
  }]
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import UserAgentOverride from '@zorilla/puppeteer-extra-plugin-stealth/evasions/user-agent-override'

// Use defaults (strips "Headless", masks Linux, sets en-US locale)
puppeteer.use(UserAgentOverride())

// Or customize
puppeteer.use(UserAgentOverride({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'de-DE,de',
  maskLinux: false // Don't mask Linux
}))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify UA components
const uaInfo = await page.evaluate(() => ({
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  languages: navigator.languages,
  brands: navigator.userAgentData?.brands
}))

console.log('User Agent:', uaInfo.userAgent) // No "HeadlessChrome"
console.log('Platform:', uaInfo.platform) // "Win32" (not "Linux")
console.log('Language:', uaInfo.language) // "en-US"
console.log('Brands:', uaInfo.brands) // Includes GREASE brand
```

### Custom User Agents

```javascript
// Windows Desktop
{ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...' }

// macOS
{ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ...' }

// Linux (with maskLinux: false)
{ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...', maskLinux: false }

// Mobile (Android)
{ userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 ...' }
```

## Testing

**Test UA Components:**
```javascript
console.log('User Agent:', navigator.userAgent)
// Should NOT contain "HeadlessChrome"

console.log('Platform:', navigator.platform)
// Should match UA (Win32, MacIntel, etc., not Linux if masked)

console.log('Languages:', navigator.languages)
// Should match Accept-Language

console.log('UA Brands:', navigator.userAgentData?.brands)
// Should include GREASE brand and proper versions
```

**Test Accept-Language Header:**
Check Network tab in DevTools - request headers should include Accept-Language.

## Accept-Language Header Order

**Why Header Order Matters:**
HTTP header order can be fingerprinted. Real browsers send headers in a specific order.

**Headful Mode (Preferred):**
Sets Accept-Language via browser user preferences, maintaining proper header order.

**Headless Mode (Workaround):**
Uses CDP Network.setUserAgentOverride which may affect header order. This is less ideal but necessary in headless mode.

## Linux Masking

**Why Mask Linux?**
Most consumer users don't run Linux. Servers typically run Linux. A Linux user agent from an automation context is suspicious.

**What It Does:**
```javascript
// Before:
"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ..."

// After:
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ..."
```

**When NOT to Mask:**
- Intentionally mimicking Linux user
- Server environment where Linux is appropriate
- Testing Linux-specific behavior

## UA Client Hints

**What are UA Client Hints?**
Modern replacement for User-Agent string, provides structured browser/OS info via HTTP headers (sec-ch-ua-*) and JavaScript API (navigator.userAgentData).

**Headers Set:**
- `sec-ch-ua`: Brand list with versions
- `sec-ch-ua-mobile`: Is mobile device
- `sec-ch-ua-platform`: OS name
- `sec-ch-ua-arch`: CPU architecture
- `sec-ch-ua-full-version`: Full browser version
- `sec-ch-ua-platform-version`: OS version
- `sec-ch-ua-model`: Device model (mobile)

## References

- [MDN: User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent)
- [MDN: Accept-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)
- [MDN: Navigator.platform](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/platform)
- [User-Agent Client Hints](https://wicg.github.io/ua-client-hints/)
- [GREASE for User-Agent](https://www.chromium.org/updates/ua-reduction/)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Fixes the UserAgent info (composed of UA string, Accept-Language, Platform, and UA hints).

If you don't provide any values this plugin will default to using the regular UserAgent string (while stripping the headless part).
Default language is set to "en-US,en", the other settings match the UserAgent string.
If you are running on Linux, it will mask the settings to look like Windows. This behavior can be disabled with the `maskLinux` option.

**Options:**
- `opts` (Object, optional, default `{}`)
  - `opts.userAgent` (string) - The user agent to use (default: browser.userAgent() with "Headless" removed)
  - `opts.locale` (string) - The locale to use in `Accept-Language` header and `navigator.languages` (default: `"en-US,en"`)
  - `opts.maskLinux` (boolean) - Whether to hide Linux as platform in the user agent (default: `true`)

**Dependencies:**
- `user-preferences` - For setting Accept-Language in headful mode

**Note:** You cannot use the regular `page.setUserAgent()` Puppeteer call in your code, as it will reset the language and platform values you set with this plugin.
