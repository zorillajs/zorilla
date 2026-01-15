# sourceurl

## Detection Technique

Puppeteer injects scripts into pages using `page.evaluate()` and related methods. These injected scripts include a `//# sourceURL=__puppeteer_evaluation_script__` comment that can be detected in stack traces, making it possible to identify Puppeteer automation.

**What Servers/Clients Check:**
- Stack trace inspection - Errors reveal script source URLs
- `sourceURL` comments in injected scripts
- Presence of `__puppeteer_evaluation_script__` identifier
- Script execution context analysis

**Browser Behavior:**
- **Real Chrome:**
  - Scripts executed via DevTools don't have Puppeteer-specific sourceURL
  - Stack traces show normal page context
- **Puppeteer (Without Evasion):**
  - Injected scripts tagged with `__puppeteer_evaluation_script__`
  - Stack traces reveal Puppeteer presence
  - Easy to detect by triggering errors and inspecting stacks

**Why This Matters:**
This is a MEDIUM severity detection method. While not checked by all detection systems, sophisticated bot detectors can trigger errors deliberately and inspect stack traces for Puppeteer signatures. The sourceURL comment is a direct identifier that shouldn't be present in normal browser usage.

## How This Evasion Works

This evasion intercepts Chrome DevTools Protocol (CDP) commands before they're sent and strips the `sourceURL` comment from injected scripts.

### Implementation Strategy

**1. Intercept CDP Commands:**
```javascript
client.send = ((originalMethod, context) =>
  async function () {
    const [method, paramArgs] = arguments || []
    // Intercept Runtime.evaluate and Runtime.callFunctionOn
  }
)(client.send, client)
```

**2. Remove sourceURL from Scripts:**
```javascript
const methodsToPatch = {
  'Runtime.evaluate': 'expression',
  'Runtime.callFunctionOn': 'functionDeclaration'
}

const SOURCE_URL_SUFFIX = '//# sourceURL=__puppeteer_evaluation_script__'

if (methodsToPatch[method]) {
  const propName = methodsToPatch[method]
  paramArgs[propName] = paramArgs[propName].replace(SOURCE_URL_SUFFIX, '')
}
```

**3. Handle Network Errors:**
The evasion also catches and ignores specific network errors that can occur when requests are cut short by redirects:
```javascript
try {
  return await originalMethod.apply(context, [method, paramArgs])
} catch (error) {
  if (error.message.includes('No resource with given identifier found')) {
    // Ignore - this happens with redirects
  } else {
    throw error
  }
}
```

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Intercepts CDP client.send method

**CDP Methods Patched:**
- `Runtime.evaluate` - When evaluating expression strings
- `Runtime.callFunctionOn` - When calling functions in page context

**Key Implementation:**
```javascript
async onPageCreated(page) {
  const client = page && typeof page._client === 'function'
    ? page._client()
    : page._client

  if (!client) {
    this.debug('Warning, missing properties to intercept CDP.', { page })
    return
  }

  const debug = this.debug
  client.send = ((originalMethod, context) =>
    async function () {
      const [method, paramArgs] = arguments || []

      const next = async () => {
        try {
          return await originalMethod.apply(context, [method, paramArgs])
        } catch (error) {
          if (error instanceof Error &&
              error.message.includes('No resource with given identifier found')) {
            debug('Caught and ignored network error', { error })
          } else {
            throw error
          }
        }
      }

      if (!method || !paramArgs) {
        return next()
      }

      const methodsToPatch = {
        'Runtime.evaluate': 'expression',
        'Runtime.callFunctionOn': 'functionDeclaration'
      }

      const SOURCE_URL_SUFFIX = '//# sourceURL=__puppeteer_evaluation_script__'

      if (!methodsToPatch[method] || !paramArgs[methodsToPatch[method]]) {
        return next()
      }

      debug('Stripping sourceURL', { method })
      paramArgs[methodsToPatch[method]] = paramArgs[methodsToPatch[method]]
        .replace(SOURCE_URL_SUFFIX, '')

      return next()
    }
  )(client.send, client)
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import SourceURL from '@zorilla/puppeteer-extra-plugin-stealth/evasions/sourceurl'

puppeteer.use(SourceURL())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Test by causing an error in evaluated script
await page.goto('https://example.com')

const stackTrace = await page.evaluate(() => {
  try {
    // Cause an error to get stack trace
    throw new Error('Test error')
  } catch (err) {
    return err.stack
  }
})

console.log('Stack trace:', stackTrace)
// Should NOT contain "__puppeteer_evaluation_script__"
```

## Testing

**Test Stack Traces:**
```javascript
// Without evasion:
Error: Test error
    at eval (eval at <anonymous> (__puppeteer_evaluation_script__:1:1))
    //                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ Detected!

// With evasion:
Error: Test error
    at eval (eval at <anonymous> (<anonymous>:1:1))
    // No Puppeteer signature
```

**Manual Test:**
```javascript
// In page context
try {
  throw new Error('Test')
} catch (err) {
  console.log(err.stack)
  // Check for __puppeteer_evaluation_script__
}
```

## Source URL Comment

**What is `//# sourceURL`?**
A special comment used by debuggers to assign a URL to evaluated code:
```javascript
eval('console.log("code");//# sourceURL=my-script.js')
```

This helps with debugging by giving anonymous code a recognizable name in DevTools.

**Why Puppeteer Uses It:**
- Helps identify which scripts came from Puppeteer vs page
- Useful for debugging Puppeteer automation scripts
- Shows up in DevTools Sources panel
- **Problem:** Also visible in stack traces, revealing Puppeteer

## CDP Interception

**Chrome DevTools Protocol (CDP):**
- Low-level protocol for controlling Chrome
- Puppeteer uses CDP for all automation
- Methods like `Runtime.evaluate` execute JavaScript
- This evasion intercepts CDP before execution

**Why CDP-Level Interception:**
The `sourceURL` is added at the CDP level by Puppeteer, so it must be removed before the CDP command is sent to Chrome. Page-level JavaScript can't remove it because it's added by the automation framework itself.

## References

- [Chrome DevTools Protocol: Runtime.evaluate](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-evaluate)
- [Source Maps: sourceURL pragma](https://tc39.es/source-map/)
- [Puppeteer Source: ExecutionContext](https://github.com/puppeteer/puppeteer/blob/main/src/common/ExecutionContext.ts)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Strip sourceURL from scripts injected by puppeteer.
It can be used to identify the presence of puppeteer via stacktraces.

**Options:**
- `opts` (optional, default `{}`)
