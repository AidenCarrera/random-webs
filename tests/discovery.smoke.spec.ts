import { expect, test } from "@playwright/test";

import { WEBSITES } from "../src/lib/websites.ts";

const storageKey = "random-webs-revealed-websites";
const website = WEBSITES.find((entry) => entry.path === "/magic-8-ball")!;

test("visiting a website directly unlocks it and links back home", async ({
  page,
}) => {
  await page.goto(website.path, { waitUntil: "domcontentloaded" });

  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[],
        storageKey,
      ),
    )
    .toContain(website.path);

  const structuredData = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) =>
      scripts.flatMap(
        (script) =>
          (JSON.parse(script.textContent ?? "{}") as { "@graph"?: unknown[] })[
            "@graph"
          ] ?? [],
      ),
    );
  expect(structuredData).toContainEqual(
    expect.objectContaining({
      "@type": "WebApplication",
      name: website.title,
    }),
  );

  const homeLink = page.locator("[data-home-badge]");
  await expect(homeLink).toHaveAttribute("href", "/");
  await homeLink.click();
  await expect(page).toHaveURL(/\/$/);

  const grid = page.locator("[data-website-grid]");
  await expect(grid.getByRole("link", { name: website.title })).toBeVisible();
  await expect(grid.getByRole("link")).toHaveCount(1);
});
