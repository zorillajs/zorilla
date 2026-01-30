# Var Modernization - Summary

**Date**: 2026-01-30

## Problem Discovered

The `noVar` rule was **not enabled** in Biome's configuration, even though you expected it to be enforced.

### Why?

Biome's `noVar` rule is **NOT part of the "recommended" ruleset** - it requires explicit configuration. This allowed legacy `var` declarations to slip through.

## Changes Made

### 1. ✅ Enabled `noVar` Rule Globally

**File**: `/biome.json`

```json
"suspicious": {
  "noExplicitAny": "error",
  "noArrayIndexKey": "off",
  "noVar": "error"  // ✅ ADDED
}
```

Now `var` declarations will be flagged as **errors** throughout the entire monorepo.

### 2. ✅ Modernized 2captcha-api.ts

**File**: `packages/puppeteer-extra-plugin-recaptcha/src/provider/2captcha-api.ts`

**Changes**: 38 insertions(+), 38 deletions(-)

Biome automatically converted:
- `var` → `const` (where values are never reassigned)
- `var` → `let` (where values are reassigned)

**Examples**:

```typescript
// BEFORE
var apiKey: string;
var apiInUrl = 'https://2captcha.com/in.php';
var defaultOptions: CaptchaOptions = { ... };

function pollCaptcha() {
  var intervalId = setInterval(() => {
    var body = '';
    var result = body.split('|');
  });
}

// AFTER
let apiKey: string;  // ← module-level variable that gets assigned later
const apiInUrl = 'https://2captcha.com/in.php';  // ← never changes
const defaultOptions: CaptchaOptions = { ... };  // ← never changes

function pollCaptcha() {
  const intervalId = setInterval(() => {  // ← never reassigned
    let body = '';  // ← accumulator, gets reassigned
    const result = body.split('|');  // ← never reassigned
  });
}
```

## Rationale

The `2captcha-api.ts` file is vendored code from an external library (https://github.com/bochkarev-artem/2captcha), but it's now being treated as **part of this project** and modernized accordingly.

Benefits of `let`/`const` over `var`:
- ✅ **Block scope** instead of function scope (prevents bugs)
- ✅ **Temporal dead zone** prevents access before declaration
- ✅ **const** signals immutability intent (makes code easier to reason about)
- ✅ **Modern JavaScript** standard (ES6+)

## Verification

### ✅ All Tests Pass
```
Test Files  3 passed (3)
Tests       17 passed | 3 skipped (20)
Duration    20.49s
```

### ✅ TypeScript Compilation Passes
```
tsc --noEmit ✅
tsc (build) ✅
```

### ✅ No Remaining var Declarations
```bash
$ pnpm biome check packages/
Checked 260 files in 48ms. No fixes applied.
```

### ✅ Changes Summary
- **1 file modernized**: `2captcha-api.ts`
- **38 var → let/const conversions**
- **Zero breaking changes**
- **All tests passing**

## Going Forward

Now that `noVar` is enabled globally as an **error**, any new code using `var` will:
1. ❌ Fail Biome linting
2. 🚫 Block CI/CD pipelines (if linting is in CI)
3. ✅ Be automatically fixable with `pnpm biome check --write --unsafe`

The entire Zorilla monorepo is now enforcing modern JavaScript variable declarations! 🎉
