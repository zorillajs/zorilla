# navigator.permissions

## Detection Technique

The Permissions API (`navigator.permissions.query()`) behaves differently in headless Chrome compared to real Chrome, particularly for `Notification.permission`. These inconsistencies create detectable patterns.

**What Servers/Clients Check:**
- `Notification.permission` value on secure vs insecure origins
- Permissions API query results for notifications
- Consistency between permission states
- Differences between headless and headful behavior

**Browser Behavior:**
- **Real Chrome (Secure HTTPS):**
  - `Notification.permission` returns `'default'`
  - Permissions query returns `{state: 'default'}`
- **Real Chrome (Insecure HTTP):**
  - `Notification.permission` returns `'denied'`
  - Permissions query returns `{state: 'denied'}`
- **Headless Chrome (Without Evasion):**
  - Inconsistent permission states
  - Different behavior than headful Chrome
  - Easy to detect with permission checks

**Why This Matters:**
This is a LOW severity detection method. Chromium bug #1052332 causes `Notification.permission` to behave oddly in headless mode. While not a primary detection vector, permission inconsistencies contribute to bot fingerprinting when combined with other signals.

## How This Evasion Works

This evasion fixes `Notification.permission` and `navigator.permissions.query()` to match real Chrome behavior based on the page's origin security.

### Implementation Strategy

**1. Fix Notification.permission on Secure Origins:**
```javascript
if (isSecure) {
  utils.replaceGetterWithProxy(Notification, 'permission', {
    apply() {
      return 'default'
    }
  })
}
```

**2. Fix permissions.query() on Insecure Origins:**
```javascript
if (!isSecure) {
  const handler = {
    apply(_target, _ctx, args) {
      const param = (args || [])[0]
      const isNotifications = param?.name && param.name === 'notifications'

      if (!isNotifications) {
        return utils.cache.Reflect.apply(...arguments)
      }

      return Promise.resolve(
        Object.setPrototypeOf(
          {
            state: 'denied',
            onchange: null
          },
          PermissionStatus.prototype
        )
      )
    }
  }

  utils.replaceWithProxy(Permissions.prototype, 'query', handler)
}
```

### Behavior by Origin

**Secure Origins (HTTPS, localhost, file://):**
- `Notification.permission` → `'default'`
- User can grant permission if prompted
- Matches real Chrome behavior

**Insecure Origins (HTTP):**
- Permissions query for notifications → `{state: 'denied'}`
- Cannot request notification permission
- Matches real Chrome security policy

## Implementation Details

**File:** `index.js`

**Lifecycle Hooks:**
- `onPageCreated(page)` - Fixes permission behavior based on origin

**Origin Detection:**
```javascript
const isSecure = document.location.protocol.startsWith('https')
```

**Key Implementation:**
```javascript
async onPageCreated(page) {
  await withUtils(page).evaluateOnNewDocument((utils, _opts) => {
    const isSecure = document.location.protocol.startsWith('https')

    // Secure origins: fix Notification.permission
    if (isSecure) {
      utils.replaceGetterWithProxy(Notification, 'permission', {
        apply() {
          return 'default'
        }
      })
    }

    // Insecure origins: fix permissions.query()
    if (!isSecure) {
      const handler = {
        apply(_target, _ctx, args) {
          const param = (args || [])[0]
          const isNotifications = param?.name && param.name === 'notifications'

          if (!isNotifications) {
            return utils.cache.Reflect.apply(...arguments)
          }

          return Promise.resolve(
            Object.setPrototypeOf(
              {
                state: 'denied',
                onchange: null
              },
              PermissionStatus.prototype
            )
          )
        }
      }

      utils.replaceWithProxy(Permissions.prototype, 'query', handler)
    }
  }, this.opts)
}
```

## Usage

```javascript
import puppeteer from '@zorilla/puppeteer-extra'
import NavigatorPermissions from '@zorilla/puppeteer-extra-plugin-stealth/evasions/navigator.permissions'

puppeteer.use(NavigatorPermissions())

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

// Test on HTTPS
await page.goto('https://example.com')

const securePerms = await page.evaluate(() => ({
  notificationPermission: Notification.permission,
  queryResult: navigator.permissions.query({ name: 'notifications' })
    .then(status => status.state)
}))

console.log('Notification.permission:', securePerms.notificationPermission) // 'default'
console.log('Query result:', await securePerms.queryResult) // 'default'

// Test on HTTP
await page.goto('http://example.com')

const insecurePerms = await page.evaluate(() => ({
  queryResult: navigator.permissions.query({ name: 'notifications' })
    .then(status => status.state)
}))

console.log('Query result (HTTP):', await insecurePerms.queryResult) // 'denied'
```

## Testing

**Test on HTTPS:**
```javascript
// On secure origin
console.log(Notification.permission) // 'default'

const status = await navigator.permissions.query({ name: 'notifications' })
console.log(status.state) // 'default'
console.log(status.onchange) // null
```

**Test on HTTP:**
```javascript
// On insecure origin
const status = await navigator.permissions.query({ name: 'notifications' })
console.log(status.state) // 'denied'
console.log(status.onchange) // null
```

## Permission States

**Notification.permission Values:**
- `'default'` - User hasn't decided yet (secure origins)
- `'granted'` - User explicitly allowed notifications
- `'denied'` - User explicitly denied OR insecure origin

**PermissionStatus.state Values:**
- `'granted'` - Permission is granted
- `'denied'` - Permission is denied
- `'prompt'` - User will be prompted

## Security Context

**Why Insecure Origins Can't Request Notifications:**
Modern browsers restrict powerful APIs (like notifications) to secure contexts for security and privacy. Insecure HTTP sites automatically get `'denied'` without the ability to request permission.

**Secure Contexts:**
- HTTPS pages
- localhost (for development)
- file:// URLs
- Pages loaded from 127.0.0.1

## References

- [Chromium Bug #1052332: Notification.permission in headless](https://bugs.chromium.org/p/chromium/issues/detail?id=1052332)
- [MDN: Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)
- [MDN: Notification.permission](https://developer.mozilla.org/en-US/docs/Web/API/Notification/permission_static)
- [MDN: Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)

## API

### class: Plugin

**Extends: PuppeteerExtraPlugin**

Pass the Permissions Test. Fixes `Notification.permission` behaving weirdly in headless mode.

**Options:**
- `opts` (optional, default `{}`)
