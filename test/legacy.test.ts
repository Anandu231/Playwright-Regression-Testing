import { test } from "@playwright/test";
import { links, owner, issue, step, attachment } from "allure-js-commons";

test("test with links", async() => {
  await links(...[{ url: "https://example.org"}]);
  await owner("John Doe x");
  await issue("JIRA-2", "https://example.org");
  await step("step 1", async () => {
    await step("step 1.2", async () => {
      await attachment("text attachment", "some data", "text/plain");
    });
  });
  await step("step 2", async () => {
  });
});
