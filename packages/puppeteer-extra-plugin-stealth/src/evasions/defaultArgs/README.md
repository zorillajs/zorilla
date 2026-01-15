# defaultArgs

## Detection Technique

When launching Chrome via automation tools like Puppeteer, certain default command-line arguments are automatically added that can reveal automation. These flags control browser features and extensions, and their presence (or the effects of their absence) can be detected by sophisticated bot detection systems.

**What Servers/Clients Check:**
- Behavior differences caused by disabled extensions
- Missing default Chrome components
- Browser feature availability that depends on command-line flags
- Side effects of automation-specific launch arguments

**Browser Behavior:**
- **Real Chrome (Normal Launch):**
  - Extensions are enabled by default
  - Default Chrome apps are available
  - Component extensions with background pages work normally
- **Puppeteer/Automation (Default Launch):**
  - `--disable-extensions` - Disables all extensions
  - `--disable-default-apps` - Disables default Chrome apps
  - `--disable-component-extensions-with-background-pages` - Disables component extensions
  - These create behavioral differences detectable by clever fingerprinting

**Why This Matters:**
This is a LOW to MEDIUM severity detection method. While these flags aren't directly inspectable from JavaScript, their effects can be observed indirectly. Disabling extensions affects the browser's feature set and behavior in subtle ways that advanced detection systems can identify. This evasion prevents those behavioral differences.

## How This Evasion Works

This evasion strips adversarial command-line arguments that Puppeteer adds by default, making the browser launch more similar to a real Chrome instance.

### Removed Arguments

**1. `--disable-extensions`**
- Puppeteer default: Disabled
- Real Chrome: Enabled
- Effect: Prevents all extensions from loading
- Why remove: Extensions are part of normal Chrome experience

**2. `--disable-default-apps`**
- Puppeteer default: Disabled
- Real Chrome: Enabled
- Effect: Prevents default Chrome apps from loading
- Why remove: Default apps are expected in real Chrome

**3. `--disable-component-extensions-with-background-pages`**
- Puppeteer default: Disabled
- Real Chrome: Enabled
- Effect: Disables component extensions that run background pages
- Why remove: Component extensions provide core Chrome functionality

### Implementation Strategy

The plugin uses the `beforeLaunch` lifecycle hook to modify launch options before Chrome starts:

```javascript
async beforeLaunch(options = {}) {
  options.ignoreDefaultArgs = options.ignoreDefaultArgs || []

  // If user explicitly disabled all args, respect that
  if (options.ignoreDefaultArgs === true) {
    return
  }

  // Add adversarial args to ignore list
  argsToIgnore.forEach(arg => {
    if (!options.ignoreDefaultArgs.includes(arg)) {
      options.ignoreDefaultArgs.push(arg)
    }
  })
}
```

### Plugin Requirements

Uses `runLast` requirement to ensure other plugins can modify launch options first:
```javascript
get requirements() {
  return new Set(['runLast'])
}
```

This allows other stealth plugins or custom plugins to add their own launch modifications before this plugin removes the unwanted defaults.

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `beforeLaunch(options)` - Modifies launch options to remove adversarial args

**Requirements:**
- `runLast` - Runs after other plugins modify launch options

**Exported Constants:**
```javascript
export const argsToIgnore = [
  '--disable-extensions',
  '--disable-default-apps',
  '--disable-component-extensions-with-background-pages'
]
```

**Key Implementation:**
```javascript
async beforeLaunch(options = {}) {
  options.ignoreDefaultArgs = options.ignoreDefaultArgs || []

  // If user wants all defaults disabled, don't interfere
  if (options.ignoreDefaultArgs === true) {
    return
  }

  // Add each adversarial arg to the ignore list
  argsToIgnore.forEach(arg => {
    if (options.ignoreDefaultArgs.includes(arg)) {
      return // Already being ignored
    }
    options.ignoreDefaultArgs.push(arg)
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import DefaultArgs from '@zorilla/puppeteer-extra-plugin-stealth/evasions/defaultArgs'

puppeteer.use(DefaultArgs())

// Launch without adversarial flags
const browser = await puppeteer.launch({
  headless: true
  // The plugin automatically removes:
  // --disable-extensions
  // --disable-default-apps
  // --disable-component-extensions-with-background-pages
})

const page = await browser.newPage()

// Browser now behaves more like real Chrome with extensions enabled
```

### Custom Launch Args

The plugin respects custom launch configurations:

```javascript
// Example 1: Adding custom args (plugin still removes adversarial ones)
const browser = await puppeteer.launch({
  headless: true,
  args: ['--window-size=1920,1080', '--disable-gpu']
  // Plugin adds to ignoreDefaultArgs:
  // ['--disable-extensions', '--disable-default-apps', '--disable-component-extensions-with-background-pages']
})

// Example 2: User wants to disable all defaults (plugin does nothing)
const browser = await puppeteer.launch({
  headless: true,
  ignoreDefaultArgs: true // Plugin respects this and doesn't modify
})

// Example 3: User already ignoring some args (plugin adds others)
const browser = await puppeteer.launch({
  headless: true,
  ignoreDefaultArgs: ['--mute-audio', '--disable-extensions']
  // Plugin adds to existing list:
  // ['--mute-audio', '--disable-extensions', '--disable-default-apps', '--disable-component-extensions-with-background-pages']
})
```

## Testing

This evasion's effects are indirect and behavioral. Testing requires checking for side effects:

**Test 1: Extensions Capability**
```javascript
// With defaultArgs evasion
const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Browser has extensions API available (though no extensions installed)
const hasExtensionsAPI = await page.evaluate(() => {
  return typeof chrome !== 'undefined' && 'runtime' in chrome
})
console.log('Has extensions API:', hasExtensionsAPI) // Depends on other evasions
```

**Test 2: Verify Launch Args**
```javascript
// Check what args were actually used
import { spawn } from 'child_process'

// You can inspect Chrome's command line by checking process args
// This requires accessing the browser's underlying process
```

**Test 3: Behavioral Differences**
Bot detection systems may check for behavioral signatures of disabled extensions. With this evasion enabled, the browser should behave more naturally.

## Why These Arguments Matter

**Extension Ecosystem:**
Real Chrome users typically have extensions installed (ad blockers, password managers, etc.). Even without extensions, having the extension system enabled creates a more authentic browser fingerprint.

**Default Apps:**
Chrome ships with default web apps (e.g., Chrome Web Store). Disabling these creates an unusual configuration not seen in normal user browsers.

**Component Extensions:**
Chrome uses internal component extensions for core features like:
- PDF viewer
- Hangouts
- Feedback reporting
- Cloud Print

Disabling these changes how Chrome behaves internally.

## References

- [Puppeteer API: LaunchOptions](https://pptr.dev/api/puppeteer.launchoptions)
- [Chromium Command Line Switches](https://peter.sh/experiments/chromium-command-line-switches/)
- [Chrome Extensions Architecture](https://www.chromium.org/developers/design-documents/extensions/)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

A CDP driver like puppeteer can make use of various browser launch arguments that are
adversarial to mimicking a regular browser and need to be stripped when launching the browser.

**Options:**
- `opts` (optional, default `{}`)

**Requirements:**
- `runLast` - Ensures other plugins can modify launch options first

**Exports:**
- `argsToIgnore` - Array of argument strings that will be removed
