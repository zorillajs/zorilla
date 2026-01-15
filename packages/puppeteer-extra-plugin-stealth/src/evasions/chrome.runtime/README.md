# chrome.runtime

## Detection Technique

The `chrome.runtime` object is part of the Chrome Extensions API. While it's primarily used by browser extensions, the object also exists on regular web pages (on secure origins) in real Chrome. In headless mode or on insecure origins, this object might be missing, which can be used as a detection signal.

**What Servers/Clients Check:**
- `window.chrome.runtime` existence - Missing in headless Chrome on secure origins
- `chrome.runtime.id` property - Should return `undefined` for non-extension pages
- `chrome.runtime.sendMessage()` method existence and behavior
- `chrome.runtime.connect()` method existence and behavior
- Method signatures and error messages when called incorrectly
- Proper validation of extension IDs (32 characters, letters a-p)

**Browser Behavior:**
- **Real Chrome (Secure Origins - HTTPS):**
  - `chrome.runtime` object exists with full API
  - `runtime.id` returns `undefined` (page is not an extension)
  - Methods exist and throw specific errors when called from web pages
  - Extension ID validation is enforced
- **Real Chrome (Insecure Origins - HTTP):**
  - `chrome.runtime` does not exist (only available on HTTPS)
- **Headless Chrome (Without Evasion):**
  - `chrome.runtime` object missing even on HTTPS
  - Easy to detect with existence check on secure origins

**Why This Matters:**
This is a MEDIUM severity detection method. The `chrome.runtime` API is complex and its presence on secure origins is expected in real Chrome. Bot detection systems check for Chrome extension APIs as part of a broader fingerprint. The sophisticated error handling and validation make this harder to fake convincingly.

## How This Evasion Works

This evasion creates a comprehensive mock of the `chrome.runtime` object with accurate static data, proper method implementations, and Chrome-like error handling including extension ID validation.

### Key Components

**1. Static Runtime Data**
Loaded from `staticData.json` file, includes properties like:
```javascript
{
  "OnInstalledReason": {
    "CHROME_UPDATE": "chrome_update",
    "INSTALL": "install",
    "SHARED_MODULE_UPDATE": "shared_module_update",
    "UPDATE": "update"
  },
  "OnRestartRequiredReason": { /* ... */ },
  "PlatformArch": { /* ... */ },
  "PlatformNaclArch": { /* ... */ },
  "PlatformOs": { /* ... */ },
  "RequestUpdateCheckStatus": { /* ... */ }
}
```

**2. Runtime ID Property**
```javascript
get id() {
  return undefined  // Non-extension pages always return undefined
}
```

**3. sendMessage() Method**
Complex validation and error handling:
- Validates number of arguments (2-4)
- Requires extension ID as first argument when called from web page
- Validates extension ID format (32 lowercase letters a-p)
- Validates options object structure
- Validates responseCallback is a function
- Throws specific `TypeError` messages matching Chrome

**4. connect() Method**
Similar comprehensive validation:
- Validates extension ID requirement
- Validates connectInfo object structure
- Checks for valid properties (`name`, `includeTlsChannelId`)
- Returns mock Port object with proper structure
- Port includes `onMessage`, `onDisconnect`, `postMessage`, `disconnect`

**5. Extension ID Validation**
Valid Chrome extension IDs must be:
- Exactly 32 characters long
- Only contain lowercase letters 'a' through 'p'
- Generated from extension's public key hash

```javascript
const isValidExtensionID = str =>
  str.length === 32 && str.toLowerCase().match(/^[a-p]+$/)
```

**6. Origin Security**
By default, only enabled on secure origins (HTTPS). Can be overridden with `runOnInsecureOrigins` option for testing.

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Injects the chrome.runtime mock

**Options:**
- `runOnInsecureOrigins` (boolean) - Enable on HTTP (default: `false`)

**Data Files:**
- `staticData.json` - Chrome runtime API constants and enums

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, { opts, STATIC_DATA }) => {
    // Create window.chrome if needed
    if (!window.chrome) {
      Object.defineProperty(window, 'chrome', {
        writable: true,
        enumerable: true,
        configurable: false,
        value: {}
      })
    }

    // Check if already exists (headful) or insecure origin
    const existsAlready = 'runtime' in window.chrome
    const isNotSecure = !window.location.protocol.startsWith('https')

    if (existsAlready || (isNotSecure && !opts.runOnInsecureOrigins)) {
      return
    }

    // Create chrome.runtime object
    window.chrome.runtime = {
      ...STATIC_DATA,
      get id() {
        return undefined
      },
      connect: null,
      sendMessage: null
    }

    // Mock sendMessage with proper validation
    const sendMessageHandler = {
      apply: (_target, _ctx, args) => {
        // Validate arguments
        // Check extension ID format
        // Return undefined (no extension to receive message)
      }
    }

    utils.mockWithProxy(
      window.chrome.runtime,
      'sendMessage',
      function sendMessage() {},
      sendMessageHandler
    )

    // Similar implementation for connect()
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import ChromeRuntime from '@zorilla/puppeteer-extra-plugin-stealth/evasions/chrome.runtime'

puppeteer.use(ChromeRuntime())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Navigate to HTTPS site (runtime only exists on secure origins)
await page.goto('https://example.com')

// Verify chrome.runtime exists
const runtimeData = await page.evaluate(() => ({
  exists: 'runtime' in window.chrome,
  id: window.chrome?.runtime?.id,
  hasSendMessage: typeof window.chrome?.runtime?.sendMessage === 'function',
  hasConnect: typeof window.chrome?.runtime?.connect === 'function',
  hasStaticData: !!(window.chrome?.runtime?.OnInstalledReason)
}))

console.log('chrome.runtime exists:', runtimeData.exists) // true
console.log('runtime.id:', runtimeData.id) // undefined
console.log('Has sendMessage:', runtimeData.hasSendMessage) // true
console.log('Has connect:', runtimeData.hasConnect) // true
console.log('Has static data:', runtimeData.hasStaticData) // true

// Test error handling
const errorTests = await page.evaluate(() => {
  const results = {}

  // Test sendMessage without arguments
  try {
    chrome.runtime.sendMessage()
  } catch (err) {
    results.noArgs = err.message.includes('No matching signature')
  }

  // Test sendMessage without extension ID
  try {
    chrome.runtime.sendMessage({ some: 'message' })
  } catch (err) {
    results.noExtId = err.message.includes('must specify an Extension ID')
  }

  // Test sendMessage with invalid extension ID
  try {
    chrome.runtime.sendMessage('invalid-id-format', { message: 'test' })
  } catch (err) {
    results.invalidExtId = err.message.includes('Invalid extension id')
  }

  // Test connect returns proper object structure
  try {
    const port = chrome.runtime.connect('abcdefghijklmnopabcdefghijklmnop', { name: 'test' })
    results.connectReturnsPort = !!(port && port.postMessage && port.onMessage)
  } catch (err) {
    results.connectError = err.message
  }

  return results
})

console.log('Error handling tests:', errorTests)
```

## Testing

Test the evasion against detection services:
- https://bot.sannysoft.com - Should show chrome.runtime as present (on HTTPS)
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass chrome.runtime checks

**Manual Test in DevTools (on HTTPS page):**
```javascript
// Check chrome.runtime exists
console.log('runtime' in chrome) // true

// Check runtime.id
console.log(chrome.runtime.id) // undefined (not an extension)

// Check static data exists
console.log(chrome.runtime.OnInstalledReason)
// {CHROME_UPDATE: "chrome_update", INSTALL: "install", ...}

// Test sendMessage validation
try {
  chrome.runtime.sendMessage()
} catch (err) {
  console.log(err.message)
  // "Error in invocation of runtime.sendMessage(...): No matching signature."
}

try {
  chrome.runtime.sendMessage({ message: 'test' })
} catch (err) {
  console.log(err.message)
  // "...sendMessage called from a webpage must specify an Extension ID..."
}

try {
  chrome.runtime.sendMessage('invalid', { message: 'test' })
} catch (err) {
  console.log(err.message)
  // "...Invalid extension id: 'invalid'"
}

// Test connect method
const extId = 'abcdefghijklmnopabcdefghijklmnop' // Valid format
const port = chrome.runtime.connect(extId, { name: 'my-port' })

console.log(port.name) // "my-port"
console.log(typeof port.postMessage) // "function"
console.log(typeof port.disconnect) // "function"
console.log(port.onMessage) // { addListener: function, ... }
console.log(port.onDisconnect) // { addListener: function, ... }

// Test port.postMessage throws when used
try {
  port.postMessage({ data: 'test' })
} catch (err) {
  console.log(err.message)
  // "Attempting to use a disconnected port object"
}
```

## Chrome Runtime API Context

**What is chrome.runtime?**
The `chrome.runtime` API is part of the Chrome Extensions API. It provides methods for:
- Message passing between extensions and web pages
- Extension lifecycle management
- Connecting to native applications
- Accessing extension metadata

**Availability on Web Pages:**
- Only available on **secure origins** (HTTPS, localhost, chrome://)
- Returns `undefined` for `runtime.id` (page is not an extension)
- Methods exist but fail when called (no extension to communicate with)
- Used by websites to detect if they're running in an extension context

**Extension ID Format:**
Chrome extension IDs are 32-character strings using only letters 'a' through 'p'. They're generated from the extension's public key using base16 encoding with custom alphabet.

Example valid ID: `abcdefghijklmnopabcdefghijklmnop`

## Advanced Error Handling

The evasion implements Chrome's exact error messages and validation:

**sendMessage Errors:**
1. **No arguments**: "No matching signature"
2. **< 2 arguments**: "must specify an Extension ID"
3. **Invalid types**: "No matching signature"
4. **Invalid extension ID**: "Invalid extension id: '{id}'"

**connect Errors:**
1. **No arguments or empty string**: "must specify an Extension ID"
2. **Invalid connectInfo**: Validates each property type
3. **Unexpected properties**: "Unexpected property: '{name}'"
4. **Type mismatches**: "Invalid type: expected {type}, found {type}"

## References

- [Chrome Extensions: chrome.runtime API](https://developer.chrome.com/docs/extensions/reference/api/runtime)
- [Chrome Extensions: Message Passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [Chrome Extension ID Format](https://source.chromium.org/chromium/chromium/src/+/master:components/crx_file/id_util.cc;drc=14a055ccb17e8c8d5d437fe080faba4c6f07beac;l=90)
- [MDN: Chrome Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Chrome_incompatibilities)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Mock the `chrome.runtime` object if not available (e.g. when running headless) and on a secure site.

**Options:**
- `opts` (optional, default `{}`)
  - `opts.runOnInsecureOrigins` (boolean) - Enable on HTTP/insecure origins for testing (default: `false`)

### sendMessageHandler()

Mock `chrome.runtime.sendMessage` with full validation:
- Argument count validation
- Extension ID requirement and format validation
- Options object structure validation
- Response callback function validation

### connectHandler()

Mock `chrome.runtime.connect` with full validation:
- Extension ID requirement and format validation
- ConnectInfo object structure validation
- Returns properly structured Port object

Returns a Port object with:
- `name` (string) - Port name
- `sender` (undefined) - Sender info
- `disconnect()` - Function to disconnect
- `onDisconnect` - Event with listener methods
- `onMessage` - Event with listener methods
- `postMessage()` - Throws error (no connected extension)
