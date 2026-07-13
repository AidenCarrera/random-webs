import { expect, test } from "@playwright/test";

test.describe("zen garden interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zen-garden", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "The Zen Garden" }),
    ).toBeVisible();
    await expect(page.getByTitle("Settings and Themes")).toBeVisible();
    await page.waitForTimeout(500);
  });

  test("plants an emoji and supports undo and redo", async ({ page }) => {
    const canvas = page.getByLabel("Interactive zen garden canvas");
    await canvas.click({ position: { x: 420, y: 220 } });
    await expect(page.locator(".zen-emoji")).toHaveCount(1);

    await page.getByTitle("Undo").click();
    await expect(page.locator(".zen-emoji")).toHaveCount(0);
    await expect(page.getByText("Undone last action")).toBeVisible();

    await page.getByTitle("Redo").click();
    await expect(page.locator(".zen-emoji")).toHaveCount(1);
    await expect(page.getByText("Redone action")).toBeVisible();
  });

  test("switches tools, themes, and opens the import flow", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Rake ☰" }).click();
    await expect(page.getByText("Random Mode")).toBeHidden();

    await page.getByRole("button", { name: "Plant 🌱" }).click();
    await expect(page.getByText("Random Mode")).toBeVisible();

    await page.getByTitle("Settings and Themes").click();
    await expect(
      page.getByRole("heading", { name: "Garden Settings" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Golden Sand" }).click();
    await expect(page.getByText("Theme: Golden Sand")).toBeVisible();

    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Import Zen Garden Layout" }),
    ).toBeVisible();
    await page.getByPlaceholder("Paste code here...").fill("invalid-layout");
    await page.getByRole("button", { name: "Import Code" }).click();
    await expect(page.getByText("Invalid code or file format.")).toBeVisible();
  });

  test("keeps compact controls accessible in mobile landscape", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 844, height: 390 });

    await expect(
      page.getByRole("heading", { name: "The Zen Garden" }),
    ).toBeHidden();
    await expect(page.getByText("Random Mode")).toBeHidden();
    await expect(page.getByRole("button", { name: "Plant 🌱" })).toBeVisible();

    await page.getByTitle("Settings and Themes").click();
    await expect(page.getByText("Quick Actions")).toBeVisible();
    await expect(page.getByText("Sound", { exact: true })).toBeVisible();
  });
});
