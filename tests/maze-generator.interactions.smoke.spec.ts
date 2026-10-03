import { expect, test } from "@playwright/test";

test.describe("maze generator interactions", () => {
  test("drafts a maze and solves it with Dijkstra", async ({ page }) => {
    await page.goto("/maze-generator", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Labyrinth" }),
    ).toBeVisible();
    await page.waitForTimeout(500);

    await page.getByRole("radio", { name: "Small" }).click();
    await page.getByRole("button", { name: "Finish drafting" }).click();
    await expect(page.getByText("Ready to explore")).toBeVisible();

    await page.getByRole("button", { name: "Solve with Dijkstra" }).click();
    await expect(page.getByText(/Solved in \d+ steps/)).toBeVisible({
      timeout: 10_000,
    });
  });
});
