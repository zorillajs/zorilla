# navigator.hardwareConcurrency

## Detection Technique

The `navigator.hardwareConcurrency` property returns the number of logical CPU cores available. In headless Chrome, this value reflects the actual server's CPU count, which can be abnormally high (64+) or unusually low (1-2) compared to typical user devices, making it a detection signal.

**What Servers/Clients Check:**
- `navigator.hardwareConcurrency` value - Abnormally high or low values indicate automation
- Correlation with other hardware properties - Should match typical consumer hardware
- Statistical analysis - Server CPUs often have more cores than consumer devices

**Browser Behavior:**
- **Real Chrome (Typical Consumer Devices):**
  - Desktop: Usually 4, 6, 8, or 12 cores
  - Laptop: Usually 2, 4, or 8 cores
  - Most common: 4 cores (represents majority of users)
- **Headless Chrome (Without Evasion):**
  - Reports actual server CPU count
  - Often 1-2 cores (minimal VMs) or 16+ cores (powerful servers)
  - Values like 64, 96, 128 cores are red flags

**Why This Matters:**
This is a LOW to MEDIUM severity detection method. While not a definitive indicator alone, unusual CPU core counts combined with other signals can reveal automation. Bot detection systems use statistical analysis of common hardware configurations, and outlier values raise suspicion.

## How This Evasion Works

This evasion replaces the `navigator.hardwareConcurrency` property with a more realistic value (default: 4) that matches typical consumer hardware.

### Implementation Strategy

```javascript
utils.replaceGetterWithProxy(
  Object.getPrototypeOf(navigator),
  'hardwareConcurrency',
  utils.makeHandler().getterValue(opts.hardwareConcurrency)
)
```

The proxy intercepts property access and returns the configured value instead of the actual server CPU count.

### Default Value

**Default: 4 cores**
- Most common consumer CPU configuration
- Safe middle ground between low-end and high-end devices
- Statistically blend in with the majority

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Replaces `navigator.hardwareConcurrency` getter

**Options:**
- `hardwareConcurrency` (number) - Number of cores to report (default: `4`)

**Key Implementation:**
```javascript
get defaults() {
  return {
    hardwareConcurrency: 4
  }
}

async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, { opts }) => {
    utils.replaceGetterWithProxy(
      Object.getPrototypeOf(navigator),
      'hardwareConcurrency',
      utils.makeHandler().getterValue(opts.hardwareConcurrency)
    )
  }, {
    opts: this.opts
  })
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import NavigatorHardwareConcurrency from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.hardwareConcurrency'

// Use default value (4 cores)
puppeteer.use(NavigatorHardwareConcurrency())

// Or customize the value
puppeteer.use(NavigatorHardwareConcurrency({ hardwareConcurrency: 8 }))

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Verify the value
const cores = await page.evaluate(() => navigator.hardwareConcurrency)
console.log('CPU cores:', cores) // 4 (or custom value)
```

### Choosing a Value

**Recommended Values:**
- **4 cores**: Most common, safest choice (default)
- **8 cores**: Common in modern mid-range to high-end devices
- **2 cores**: Low-end/older devices (less common but realistic)
- **6 cores**: High-end devices

**Avoid:**
- **1 core**: Very unusual for modern devices
- **16+ cores**: Uncommon in consumer devices, raises suspicion
- **Odd numbers** (except multiples of 2): Less common due to CPU architecture

## Testing

**Manual Test:**
```javascript
// Check current value
console.log('Hardware Concurrency:', navigator.hardwareConcurrency)

// Should be 4 with default evasion
// Without evasion, shows actual server CPU count
```

**Statistical Analysis:**
According to browser usage statistics:
- 4 cores: ~35-40% of users
- 2 cores: ~20-25% of users
- 8 cores: ~15-20% of users
- 6 cores: ~10-15% of users
- 12+ cores: ~5-10% of users

## Hardware Concurrency Context

**What It Represents:**
- Number of logical processors (includes hyper-threading)
- Example: 4-core CPU with hyper-threading = 8 logical processors
- Used by web applications to optimize worker thread usage

**Typical Configurations:**
- **Desktop (Consumer):** 4-12 cores
- **Laptop:** 2-8 cores
- **Mobile:** 4-8 cores (not typically used with Puppeteer)
- **Server:** 8-128+ cores (red flag for consumer browsing)

## References

- [MDN: Navigator.hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency)
- [Statistical Analysis: OS and Hardware Concurrency](https://arh.antoinevastel.com/reports/stats/osName_hardwareConcurrency_report.html)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Set the hardwareConcurrency to 4 (optionally configurable with `hardwareConcurrency`)

**Options:**
- `opts` (Object, optional, default `{}`)
  - `opts.hardwareConcurrency` (number) - The value to use in `navigator.hardwareConcurrency` (default: `4`)
