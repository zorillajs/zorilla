# Stealth Plugin Demo Scripts

This directory contains TypeScript demo scripts that test the effectiveness of the `@zorilla/puppeteer-extra-plugin-stealth` plugin by attempting to access a bot-protected resource.

## What These Scripts Do

These scripts demonstrate the **before and after** effectiveness of the stealth plugin by:

1. Launching a headless browser (Puppeteer or Playwright)
2. Navigating to the protected resource at `/api/secret`
3. Running through **15 client-side detection tests** + server-side checks
4. Displaying the detection score (out of 124 points)
5. Showing whether access was **granted** (score ≥ 75) or **blocked** (score < 75)
6. Taking a screenshot of the result

## Scripts

### Puppeteer Scripts

**`puppeteer-no-stealth.ts`**
- Launches Puppeteer **WITHOUT** the stealth plugin
- **Expected Result**: 🚫 Blocked (score: 20-30/124)
- Demonstrates how automated browsers are easily detected

**`puppeteer-with-stealth.ts`**
- Launches Puppeteer **WITH** the stealth plugin enabled
- **Expected Result**: ✅ Access Granted (score: 115-124/124)
- Demonstrates how the stealth plugin bypasses detection

### Playwright Scripts

**`playwright-no-stealth.ts`**
- Launches Playwright **WITHOUT** the stealth plugin
- **Expected Result**: 🚫 Blocked (score: 20-30/124)

**`playwright-with-stealth.ts`**
- Launches Playwright **WITH** the stealth plugin enabled
- **Expected Result**: ✅ Access Granted (score: 115-124/124)

### Comparison Script

**`compare.ts`**
- Runs all 4 demos sequentially
- Generates a comparison table showing:
  - Demo name
  - Result (Blocked / Granted)
  - Detection score
  - Execution time
- Saves detailed JSON report to `comparison-report.json`
- Takes screenshots of all results

## Running the Scripts

### Prerequisites

1. **Start the demo site** (in one terminal):
   ```bash
   pnpm --filter @zorilla/demo-site run dev
   # Site will be available at http://localhost:8787
   ```

2. **Run demo scripts** (in another terminal):

### Individual Demos

```bash
# Puppeteer without stealth (should be blocked)
pnpm --filter @zorilla/demo-site run demo:puppeteer:no-stealth

# Puppeteer with stealth (should succeed)
pnpm --filter @zorilla/demo-site run demo:puppeteer:with-stealth

# Playwright without stealth (should be blocked)
pnpm --filter @zorilla/demo-site run demo:playwright:no-stealth

# Playwright with stealth (should succeed)
pnpm --filter @zorilla/demo-site run demo:playwright:with-stealth
```

### Run All Demos and Compare

```bash
# Run all 4 demos and generate comparison report
pnpm --filter @zorilla/demo-site run demo:compare
```

This will:
- Execute all 4 demos sequentially
- Display a comparison table in the console
- Save screenshots: `puppeteer-no-stealth.png`, `puppeteer-with-stealth.png`, etc.
- Generate `comparison-report.json` with detailed results

## Testing Against Production

To test against the live deployed site instead of localhost:

```bash
TARGET_URL=https://zorilla-demo.pages.dev/api/secret pnpm --filter @zorilla/demo-site run demo:compare
```

## Expected Output

### Without Stealth
```
🤖 Puppeteer WITHOUT stealth plugin

Target: http://localhost:8787/api/secret

❌ REDIRECTED TO BLOCKED PAGE - Bot detected!

Response status: 200
Final URL: http://localhost:8787/blocked

🚫 ACCESS DENIED
Detection Score: 29 / 124

Failed detection checks:
  - navigator.webdriver
  - Chrome Runtime
  - Plugins Array
  - WebGL Vendor
  ...

📸 Screenshot saved: puppeteer-no-stealth.png

✅ Browser closed
```

### With Stealth
```
🥷 Puppeteer WITH stealth plugin

Target: http://localhost:8787/api/secret

Response status: 200
Final URL: http://localhost:8787/api/secret

✅ ACCESS GRANTED - Stealth plugin worked!

🎉 Secret content retrieved!
📊 Detection Score: 119 / 124

Test Results: 14 passed, 1 failed

📸 Screenshot saved: puppeteer-with-stealth.png

✅ Browser closed
```

## Detection Tests

The scripts test against **15 detection techniques**:

**Critical (15 points each):**
- navigator.webdriver flag
- navigator.plugins array (empty = headless)
- User-Agent analysis (contains "Headless")

**High (10 points each):**
- Chrome runtime API
- Chrome app API
- WebGL vendor/renderer (Google SwiftShader = headless)
- MIME types array

**Medium (5 points each):**
- Chrome CSI timing API
- Chrome loadTimes API
- Navigator languages array
- Window outer dimensions
- Notification permissions

**Low (2 points each):**
- Media codec support
- iframe contentWindow behavior

**Total**: 124 points | **Threshold**: 75 points

## Output Files

Each script generates:

1. **Screenshot** - PNG file showing the final page state
   - `puppeteer-no-stealth.png`
   - `puppeteer-with-stealth.png`
   - `playwright-no-stealth.png`
   - `playwright-with-stealth.png`

2. **Comparison Report** (from `compare.ts`)
   - `comparison-report.json` - Detailed JSON report with:
     - Demo results
     - Detection scores
     - Test results
     - Execution times
     - Success/failure status

## Technical Details

### TypeScript Implementation

All scripts are written in TypeScript and executed using **tsx** (TypeScript Execute):

- Proper type annotations for Puppeteer/Playwright APIs
- Type-safe window object extensions for detection properties
- Interface definitions for test results
- Proper error handling with type guards

### Type Checking

The scripts are type-checked during CI along with the rest of the demo site:

```bash
# Type check all TypeScript files including scripts
pnpm --filter @zorilla/demo-site run build
```

### Browser Automation

- **Puppeteer**: Uses `@zorilla/puppeteer-extra` framework
- **Playwright**: Uses `@zorilla/playwright-extra` framework
- **Stealth Plugin**: `@zorilla/puppeteer-extra-plugin-stealth`

All use workspace dependencies, so changes to the stealth plugin are immediately testable.

## Troubleshooting

### Scripts can't connect to localhost:8787

Make sure the demo site is running:
```bash
pnpm --filter @zorilla/demo-site run dev
```

### Scripts show unexpected results

1. Clear browser cache/cookies (though headless should be clean)
2. Restart the Wrangler dev server
3. Check if the target URL is correct
4. Verify workspace dependencies are installed: `pnpm install` from monorepo root

### TypeScript errors

Make sure tsx is installed:
```bash
pnpm install
```

Run type checking:
```bash
cd packages/demo-site
pnpm run build
```

## Further Reading

- [Puppeteer Extra Documentation](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra)
- [Stealth Plugin Documentation](https://github.com/zorillajs/zorilla/tree/main/packages/puppeteer-extra-plugin-stealth)
- [Playwright Extra Documentation](https://github.com/zorillajs/zorilla/tree/main/packages/playwright-extra)
- [Demo Site Documentation](../../README.md)
