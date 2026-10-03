import { expect, test } from "@playwright/test";

test.describe("maze generator interactions", () => {
  test("drafts a maze and solves it with each solver", async ({ page }) => {
    await page.goto("/maze-generator", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Labyrinth" }),
    ).toBeVisible();
    await page.waitForTimeout(500);

    await page.getByRole("radio", { name: "Small" }).click();
    await page.getByRole("button", { name: "Finish drafting" }).click();
    await expect(page.getByText("Ready to explore")).toBeVisible();

    await page.getByRole("button", { name: "Solve with BFS" }).click();
    await expect(page.getByText(/Solved in \d+ steps/)).toBeVisible({
      timeout: 10_000,
    });

    // Picking another solver redraws the search that is on the sheet.
    for (const [label, name] of [
      ["Depth-first search", "DFS"],
      ["A-star search", "A*"],
    ]) {
      await page.getByRole("radio", { name: label }).click();
      await expect(page.getByText(`${name} searching…`)).toBeVisible();
      await expect(page.getByText(/Solved in \d+ steps/)).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
