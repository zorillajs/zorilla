# webgl.vendor

## Detection Technique

WebGL (Web Graphics Library) is used for rendering 2D and 3D graphics in browsers. The WebGL context exposes information about the underlying GPU (Graphics Processing Unit) through vendor and renderer strings. In headless Chrome, these strings reveal "Google Inc." and "Google SwiftShader", which are dead giveaways of automation.

**What Servers/Clients Check:**
- `UNMASKED_VENDOR_WEBGL` (parameter 37445) - Returns GPU vendor name
- `UNMASKED_RENDERER_WEBGL` (parameter 37446) - Returns GPU model/renderer name
- WebGL fingerprinting: Combines vendor/renderer with other WebGL capabilities for unique fingerprint

**Browser Behavior:**
- **Real Chrome (Hardware GPU):**
  - Vendor: "Intel Inc.", "NVIDIA Corporation", "AMD", "Apple Inc.", etc.
  - Renderer: Specific GPU model like "Intel(R) Iris(TM) Graphics 6100"
- **Headless Chrome (Software Renderer):**
  - Vendor: "Google Inc." (reveals headless/automated browser)
  - Renderer: "Google SwiftShader" or "ANGLE (Google SwiftShader)"
- **Firefox:**
  - Uses ANGLE wrapper on Windows, different vendor strings

**Why This Matters:**
This is a HIGH severity detection method. The "Google Inc." / "SwiftShader" combination is exclusively used in headless Chrome and is one of the most reliable automation indicators. Combined with other WebGL capabilities, it creates a unique fingerprint that's very hard to fake without proper evasion.

## How This Evasion Works

This evasion proxies the `getParameter()` method on both WebGL and WebGL2 rendering contexts to return realistic hardware GPU strings instead of the headless defaults.

### Implementation Strategy

```javascript
// Proxy both WebGL contexts
const getParameterProxyHandler = {
  apply: function(target, ctx, args) {
    const param = args[0]

    // Intercept vendor request
    if (param === 37445) {
      return opts.vendor || 'Intel Inc.'
    }

    // Intercept renderer request
    if (param === 37446) {
      return opts.renderer || 'Intel Iris OpenGL Engine'
    }

    // Pass through all other parameters
    return Reflect.apply(target, ctx, args)
  }
}

// Apply to both WebGL 1.0 and 2.0 contexts
WebGLRenderingContext.prototype.getParameter = new Proxy(
  WebGLRenderingContext.prototype.getParameter,
  getParameterProxyHandler
)

WebGL2RenderingContext.prototype.getParameter = new Proxy(
  WebGL2RenderingContext.prototype.getParameter,
  getParameterProxyHandler
)
```

### Default Values

The evasion uses realistic default values that match common hardware:

**Default Vendor:** `"Intel Inc."`
- Most common GPU vendor in laptops
- Statistically safe choice that blends in

**Default Renderer:** `"Intel Iris OpenGL Engine"`
- Integrated GPU found in many MacBooks and laptops
- Generic enough to avoid unique fingerprinting
- Realistic for typical browsing scenarios

### Customization

You can customize both vendor and renderer to match specific hardware:

```javascript
// Match NVIDIA desktop GPU
NavigatorWebdriver({
  vendor: 'NVIDIA Corporation',
  renderer: 'NVIDIA GeForce GTX 1080/PCIe/SSE2'
})

// Match AMD GPU
NavigatorWebdriver({
  vendor: 'AMD',
  renderer: 'AMD Radeon RX 5700 XT'
})

// Match Apple Silicon
NavigatorWebdriver({
  vendor: 'Apple Inc.',
  renderer: 'Apple M1'
})
```

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Proxies WebGL getParameter methods

**Options:**
- `vendor` (string) - GPU vendor string (default: "Intel Inc.")
- `renderer` (string) - GPU renderer string (default: "Intel Iris OpenGL Engine")

**WebGL Parameter Codes:**
- `37445` - `UNMASKED_VENDOR_WEBGL` constant
- `37446` - `UNMASKED_RENDERER_WEBGL` constant

**Key Implementation:**
```javascript
const proxy Handler = {
  apply: function(target, ctx, args) {
    const param = (args || [])[0]
    const result = Reflect.apply(target, ctx, args)

    // Intercept specific parameters
    if (param === 37445) {
      return opts.vendor
    }
    if (param === 37446) {
      return opts.renderer
    }

    // Return original result for all other parameters
    return result
  }
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import WebGLVendor from '@zorilla/puppeteer-extra-plugin-stealth/evasions/webgl.vendor'

// Use default Intel GPU values
puppeteer.use(WebGLVendor())

// Or customize to match specific hardware
puppeteer.use(WebGLVendor({
  vendor: 'NVIDIA Corporation',
  renderer: 'NVIDIA GeForce RTX 3080'
}))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify WebGL vendor/renderer are spoofed
const webglInfo = await page.evaluate(() => {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl')

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')

  return {
    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  }
})

console.log('WebGL Vendor:', webglInfo.vendor) // Intel Inc.
console.log('WebGL Renderer:', webglInfo.renderer) // Intel Iris OpenGL Engine
```

## Testing

Test against detection services:
- https://bot.sannysoft.com - Should show hardware GPU, not Google/SwiftShader
- https://browserleaks.com/webgl - Should show spoofed vendor/renderer
- https://arh.antoinevastel.com/bots/areyouheadless - Should pass WebGL checks

**Manual Test:**
```javascript
// In browser console
const canvas = document.createElement('canvas')
const gl = canvas.getContext('webgl')
const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')

console.log('Vendor:', gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
console.log('Renderer:', gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
// Should NOT show "Google Inc." or "SwiftShader"
```

## WebGL Fingerprinting

Bot detection systems often combine WebGL vendor/renderer with other WebGL capabilities to create a unique fingerprint:

**Common Fingerprinting Techniques:**
1. **Canvas fingerprinting** - Renders text/graphics and hashes pixel data
2. **WebGL extensions** - Lists supported extensions (varies by GPU)
3. **WebGL parameters** - Max texture size, max vertex attributes, etc.
4. **Shader precision** - Vertex and fragment shader precision ranges

**Why Vendor/Renderer Matters:**
Even with identical WebGL capabilities, the vendor/renderer strings create a unique identifier. "Google SwiftShader" is immediately identifiable as a software renderer used exclusively in headless mode, making it a critical detection vector.

## Common Hardware Combinations

For reference, here are common real-world GPU configurations:

**Intel Integrated (Laptops):**
- Vendor: "Intel Inc."
- Renderer: "Intel(R) Iris(TM) Graphics 6100", "Intel(R) UHD Graphics 630"

**NVIDIA (Gaming/Workstation):**
- Vendor: "NVIDIA Corporation"
- Renderer: "GeForce GTX 1080", "GeForce RTX 3080", "Quadro P5000"

**AMD (Gaming):**
- Vendor: "AMD", "ATI Technologies Inc."
- Renderer: "Radeon RX 5700 XT", "Radeon Pro 580"

**Apple Silicon:**
- Vendor: "Apple Inc."
- Renderer: "Apple M1", "Apple M2"

**Mobile (Android/iOS):**
- Various Arm Mali, Adreno, PowerVR GPUs

## References

- [MDN: WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [WebGL Extensions: WEBGL_debug_renderer_info](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info)
- [Browser Leaks: WebGL Fingerprinting](https://browserleaks.com/webgl)
- [Google SwiftShader](https://github.com/google/swiftshader) - Software renderer used in headless Chrome

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Fix WebGL Vendor/Renderer being set to Google in headless mode.

**Options:**
- `opts` (Object, optional)
  - `opts.vendor` (string) - The vendor string to use (default: `"Intel Inc."`)
  - `opts.renderer` (string) - The renderer string (default: `"Intel Iris OpenGL Engine"`)

Example data (Apple Retina MBP 13): `{vendor: "Intel Inc.", renderer: "Intel(R) Iris(TM) Graphics 6100"}`
