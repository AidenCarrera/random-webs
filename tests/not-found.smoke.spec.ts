import { expect, test } from "@playwright/test";

import { WEBSITES } from "../src/lib/websites.ts";

const storageKey = "random-webs-revealed-websites";

test("404 random discovery unlocks its destination on the home page", async ({
  page,
}) => {
  const response = await page.goto("/this-route-does-not-exist", {
    waitUntil: "domcontentloaded",
  });

  expect(response?.status()).toBe(404);
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to Home" }),
  ).toHaveAttribute("href", "/");

  await page.getByRole("button", { name: "Explore Random Website" }).click();
  await expect(page).not.toHaveURL(/this-route-does-not-exist/);

  const destinationPath = new URL(page.url()).pathname;
  const destination = WEBSITES.find(
    (website) => website.path === destinationPath,
  );
  const savedPaths = await page.evaluate(
    (key) => JSON.parse(window.localStorage.getItem(key) ?? "[]") as string[],
    storageKey,
  );

  expect(destination).toBeDefined();
  expect(savedPaths).toContain(destinationPath);

  await page.goto("/");
  await expect(
    page.getByRole("link", { name: destination?.title }),
  ).toBeVisible();
});
