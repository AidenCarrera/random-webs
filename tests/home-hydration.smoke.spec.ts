import { expect, test } from "@playwright/test";

import { WEBSITES } from "../src/lib/websites.ts";

test.use({ javaScriptEnabled: false });

test("home page server render masks website names and descriptions", async ({
  page,
}) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  const firstWebsite = WEBSITES[0];
  const maskedTitle = firstWebsite.title.replace(/\S/g, "?");
  const maskedBlurb = firstWebsite.blurb.replace(/\S/g, "?");

  expect(response?.ok()).toBe(true);
  await expect(page.locator("h2").first()).toHaveText(maskedTitle);
  await expect(page.locator("h2").first()).not.toHaveText(firstWebsite.title);
  await expect(page.locator("h2").first().locator("~ p")).toHaveText(
    maskedBlurb,
  );
});
