import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: "./test",
  use: {
    trace: "on",
    screenshot: "only-on-failure",
  },
  reporter: [
    ["list"],
    [
      "allure-playwright",
      {
        outputFolder: "./out/allure-results",
        environmentInfo: {
          node_version: process.version,
        },
      },
    ],
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  outputDir: "test-results/",
};

export default config;
