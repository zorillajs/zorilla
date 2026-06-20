import type { PlaywrightTestConfig } from '@playwright/test';

const chromiumOnly = process.env.PLAYWRIGHT_EXTRA_CHROMIUM_ONLY === 'true';
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;

const config: PlaywrightTestConfig = {
  retries: 3,
  workers: 3,

  use: {
    browserName: 'chromium',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          chromiumSandbox: !process.env.CI,
          executablePath: chromiumExecutablePath,
          args: process.env.CI
            ? ['--no-sandbox', '--disable-setuid-sandbox']
            : [],
        },
      },
    },
    ...(chromiumOnly
      ? []
      : [
          {
            name: 'firefox',
            use: {
              browserName: 'firefox' as const,
            },
          },
          {
            name: 'webkit',
            use: {
              browserName: 'webkit' as const,
              // Note: webkit doesn't support --no-sandbox
            },
          },
        ]),
  ],
};

export default config;
