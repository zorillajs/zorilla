# Security Policy

## Supported Versions

Zorilla is a monorepo that publishes multiple packages under the `@zorilla` scope.

We provide security fixes on a best-effort basis for:

| Version | Supported |
| --- | --- |
| Latest published release of each package | Yes |
| `main` branch | Yes |
| Older releases | No |

If a fix is only available on `main`, maintainers may choose whether to backport it to an older published version.

## Reporting a Vulnerability

Please do not open a public GitHub issue for suspected security vulnerabilities.

Instead, report the issue privately by emailing `justin.beckwith@gmail.com` with:

- A description of the vulnerability
- The affected package or packages
- Steps to reproduce or a proof of concept
- The impact you expect
- Any suggested remediation, if you have one

We will acknowledge reports on a best-effort basis and work with you on validation, remediation, and coordinated disclosure.

## Scope

This policy applies to security issues in code maintained in this repository, including:

- Packages published under the `@zorilla` scope
- Build, release, and CI configuration in this repository
- Documented examples that could directly introduce a security issue for users

The following are usually out of scope unless the repository itself is the root cause:

- Vulnerabilities in third-party dependencies that have not been patched upstream yet
- Browser-specific security behavior in Chromium, Firefox, WebKit, Puppeteer, or Playwright
- Abuse reports, scraping policy disputes, or questions about detection evasion that are not security vulnerabilities in Zorilla itself

## Disclosure Expectations

Please allow maintainers reasonable time to investigate and prepare a fix before any public disclosure.

When a report is confirmed, maintainers may:

- Release a fix in the affected package or packages
- Publish release notes or an advisory describing impact and remediation
- Credit the reporter, if they would like to be acknowledged
