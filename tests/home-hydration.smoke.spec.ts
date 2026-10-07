import { expect, test } from "@playwright/test";

import { WEBSITES } from "../src/lib/websites.ts";

test.use({
  javaScriptEnabled: false,
  viewport: { width: 390, height: 844 },
});

test("home page server render keeps the grid masked and the index crawlable", async ({
  page,
}) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  const firstWebsite = WEBSITES[0];
  const maskedTitle = firstWebsite.title.replace(/\S/g, "?");
  const grid = page.locator("[data-website-grid]");

  expect(response?.ok()).toBe(true);
  await expect(grid.locator("> *")).toHaveCount(WEBSITES.length);

  // Masks are painted via CSS, adding no text to the DOM.
  const gridText = (await grid.textContent()) ?? "";
  expect(gridText).not.toContain("?");
  expect(gridText).not.toContain(firstWebsite.title);
  await expect(grid.locator("a")).toHaveCount(0);

  const paintedMask = await grid
    .locator("[data-mask]")
    .nth(1)
    .evaluate((element) => getComputedStyle(element, "::before").content);
  expect(paintedMask).toBe(`"${maskedTitle}"`);

  const index = page.locator("[data-site-index]");
  await expect(index).not.toHaveAttribute("open");
  await expect(index.locator("a")).toHaveCount(WEBSITES.length);

  for (const website of WEBSITES) {
    await expect(index.locator(`a[href="${website.path}"]`)).toHaveText(
      website.title,
    );
  }

  const mobileColumnCount = await grid.evaluate(
    (element) =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length,
  );
  expect(mobileColumnCount).toBe(2);
});
