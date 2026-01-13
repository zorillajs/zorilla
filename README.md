# zorilla [![Downloads](https://img.shields.io/endpoint?style=social&url=https://runkit.io/fezvrasta/combined-npm-downloads/1.0.0?packages=@zorilla/puppeteer-extra,@zorilla/puppeteer-extra-plugin,@zorilla/puppeteer-extra-plugin-stealth,@zorilla/puppeteer-extra-plugin-recaptcha,@zorilla/puppeteer-extra-plugin-adblocker)](https://github.com/zorillajs/zorilla/)

---

## 🎉 Hard Fork of puppeteer-extra

**This project is a hard fork of the excellent [puppeteer-extra](https://github.com/berstend/puppeteer-extra) project originally created and maintained by [Tobias Buschor (@berstend)](https://github.com/berstend).**

The original puppeteer-extra project was an incredible contribution to the Puppeteer ecosystem, pioneering the modular plugin architecture that made browser automation more powerful and extensible. We are deeply grateful to Tobias and all the original contributors for their outstanding work.

### Why this fork exists

The original project is no longer actively maintained. This fork exists to:
- Continue maintenance and provide bug fixes
- Keep dependencies up to date with modern Puppeteer and Playwright versions
- Support the community with ongoing development
- Maintain backward compatibility where possible

All credit for the original architecture, design, and implementation goes to the original puppeteer-extra team. We're simply ensuring this valuable tool remains available and functional for the community.

📚 **Original project:** [github.com/berstend/puppeteer-extra](https://github.com/berstend/puppeteer-extra)

---

This is the monorepo for [`@zorilla/puppeteer-extra`](./packages/puppeteer-extra), a modular plugin framework for [`puppeteer`](https://github.com/puppeteer/puppeteer). :-)

🌟 **For more information, please head over to the [`@zorilla/puppeteer-extra`](./packages/puppeteer-extra) package.**

We also support Playwright! Check out [`@zorilla/playwright-extra`](./packages/playwright-extra) for Playwright integration.

## Monorepo

<details>
 <summary><strong>Contributing</strong></summary>

### Contributing

PRs and new plugins are welcome! The plugin API for `puppeteer-extra` is clean and fun to use. Have a look at the [`@zorilla/puppeteer-extra-plugin`](./packages/puppeteer-extra-plugin) base class to get started, and check out the [existing plugins](./packages/) for reference.

We use a [monorepo](https://github.com/zorillajs/zorilla) powered by [pnpm workspaces](https://pnpm.io/workspaces), [Changesets](https://github.com/changesets/changesets) for version management, [Vitest](https://vitest.dev/) for testing, and [Biome](https://biomejs.dev/) for linting and formatting.

</details>

<details>
 <summary><strong>Development</strong></summary>

### Development

This monorepo is managed with [pnpm workspaces](https://pnpm.io/workspaces) and [Changesets](https://github.com/changesets/changesets).

#### Initial setup

```bash
# Install dependencies
pnpm install

# Build all TypeScript sources
pnpm build
```

#### Development workflow

```bash
# Run all tests across all packages
pnpm test

# Run tests with coverage
pnpm -r run test:coverage

# Run tests in a specific package
cd packages/puppeteer-extra-plugin-stealth
pnpm test

# Run tests with coverage in a specific package
cd packages/puppeteer-extra
pnpm test:coverage

# Lint and format code
pnpm check       # Check for issues
pnpm fix         # Fix issues automatically

# Check links in markdown files
pnpm links       # Check all links in markdown files

# Clean install (if needed)
rm -rf node_modules pnpm-lock.yaml
pnpm store prune
pnpm install
```

#### Testing

All packages use [Vitest](https://vitest.dev/) for unit testing with coverage support:

```bash
# Run tests in watch mode
pnpm test

# Run tests once with coverage
pnpm test:coverage
```

For `@zorilla/playwright-extra`, which uses `@playwright/test`, coverage is collected via c8.

#### Publishing

We use [Changesets](https://github.com/changesets/changesets) for version management and publishing:

```bash
# Make sure you're signed into npm
npm whoami

# Ensure everything is built and tested
pnpm install
pnpm build
pnpm test

# Create a changeset for your changes
pnpm changeset

# Version packages (updates package.json versions and changelogs)
pnpm version

# Publish to npm
pnpm release
```

</details>

<br>
<p align="center">
  <img src="https://i.imgur.com/EuqiF5F.png"  height="240"  />
</p>
