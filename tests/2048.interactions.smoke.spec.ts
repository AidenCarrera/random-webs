import { expect, test } from "@playwright/test";

test.describe("2048 interactions", () => {
  test("merges tiles and scores them", async ({ page }) => {
    await page.goto("/2048", { waitUntil: "domcontentloaded" });
    await page.evaluate(() =>
      localStorage.setItem(
        "2048:game",
        JSON.stringify({
          tiles: [
            { id: 1, value: 8, row: 0, col: 0 },
            { id: 2, value: 8, row: 0, col: 3 },
          ],
          score: 0,
          best: 0,
          won: false,
          keepPlaying: false,
        }),
      ),
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "2048" })).toBeVisible();
    await page.waitForTimeout(500);

    await page.keyboard.press("ArrowLeft");
    await expect(
      page.getByRole("group", { name: "2048 board" }).getByText("16"),
    ).toBeVisible();
    await expect(page.getByText("Best").locator("..")).toContainText("16");
  });
});
