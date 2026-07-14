import { expect, test } from "@playwright/test";

test.describe("Falling Sand interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/falling-sand");
    await expect(
      page.getByRole("heading", { name: "Falling Sand" }),
    ).toBeVisible();
    await expect(page.getByText("Preparing the sandbox")).toBeHidden();
  });

  test("draws, pauses, saves, and restores a world", async ({ page }) => {
    await expect(
      page.getByText("Draw a world. Let physics finish it."),
    ).toHaveCount(0);
    const drawingHint = page.getByText(
      "Draw with a pointer or touch. Scroll to resize. Right-click erases.",
    );
    await expect(drawingHint).toBeVisible();
    await page.getByRole("button", { name: "Dismiss drawing tips" }).click();
    await expect(drawingHint).toBeHidden();

    const water = page.getByRole("button", { name: "Water" });
    await water.click();
    await expect(water).toHaveAttribute("aria-pressed", "true");

    const canvas = page.getByLabel(
      "Interactive falling sand simulation. Draw materials with a pointer or touch.",
    );
    await canvas.click({ position: { x: 360, y: 120 } });
    await canvas.hover();
    await page.mouse.wheel(0, -100);
    await expect(page.locator('output[for="sand-brush-size"]')).toHaveText("6");
    await page.mouse.wheel(0, 100);
    await expect(page.locator('output[for="sand-brush-size"]')).toHaveText("5");
    await expect(page.getByText("G", { exact: true })).toHaveCount(1);
    await page.keyboard.press("g");
    await expect(page.getByRole("button", { name: "Powder" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.getByRole("button", { name: "Pause" }).click();
    await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

    await page.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Creation saved in this browser."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Clear" }).click();
    await page.getByRole("button", { name: "Load", exact: true }).click();
    await expect(page.getByText("Saved creation loaded.")).toBeVisible();
  });

  test("downloads a PNG and opens the shared export preview", async ({
    page,
  }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PNG" }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /^falling-sand-\d{4}-\d{2}-\d{2}\.png$/,
    );
    await expect(
      page.getByRole("heading", { name: "Your pocket world" }),
    ).toBeVisible();
    await expect(page.getByText("Share your world")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "X", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close export preview" }).click();
    await expect(
      page.getByRole("heading", { name: "Your pocket world" }),
    ).toBeHidden();
  });
});
