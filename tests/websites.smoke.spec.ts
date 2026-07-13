import path from "node:path";

import { expect, test } from "@playwright/test";

import { getChangedWebsites } from "../scripts/lib/changed-websites.ts";
import { WEBSITES } from "../src/lib/websites.ts";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const changedOnly = process.env.SMOKE_CHANGED_ONLY === "true";
const websites = changedOnly
  ? getChangedWebsites(repositoryRoot)
  : [...WEBSITES].sort((left, right) =>
      left.path.localeCompare(right.path, "en"),
    );

test.describe("registered website smoke tests", () => {
  test.describe.configure({ mode: "parallel" });

  if (websites.length === 0) {
    test("no modified websites need smoke testing", () => {
      expect(websites).toHaveLength(0);
    });
  }

  for (const website of websites) {
    test(`${website.path} loads without browser errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      const response = await page.goto(website.path, {
        waitUntil: "domcontentloaded",
      });

      expect(
        response,
        `${website.path} did not return a document response`,
      ).not.toBeNull();
      expect(
        response?.ok(),
        `${website.path} returned HTTP ${response?.status()}`,
      ).toBe(true);

      await expect
        .poll(async () => (await page.title()).trim(), {
          message: `${website.path} should have a document title`,
        })
        .not.toBe("");

      await page.waitForTimeout(500);

      expect.soft(pageErrors, pageErrors.join("\n")).toEqual([]);
      expect.soft(consoleErrors, consoleErrors.join("\n")).toEqual([]);
    });
  }
});
