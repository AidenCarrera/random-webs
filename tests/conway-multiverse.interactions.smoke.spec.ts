import { expect, test } from "@playwright/test";

test.describe("conway multiverse interactions", () => {
  test("runs the map and travels between universes", async ({ page }) => {
    await page.goto("/conway-multiverse", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Conway Multiverse" }),
    ).toBeVisible();
    await expect(page.getByLabel("Generation", { exact: true })).not.toHaveText(
      "0",
    );

    await page.getByRole("button", { name: "Landmarks" }).click();
    await page.getByRole("button", { name: /Ant Colony/ }).click();
    const rule = page.getByLabel("Rule", { exact: true });
    await expect(rule).toHaveText("B3/S234");
    await expect(page).toHaveURL(/#B3\/S234$/);

    await page
      .getByRole("button", { name: "Travel to B3/S23", exact: true })
      .click();
    await expect(rule).toHaveText("B3/S23");
    await expect(
      page.getByRole("heading", { name: "Conway's Life" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Birth with 6 neighbors" }).click();
    await expect(rule).toHaveText("B36/S23");
    await expect(
      page.getByRole("heading", { name: "Off the map" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Back to the map" }).click();
    await expect(page.getByLabel("Living universes")).toBeVisible();
    await expect(page).not.toHaveURL(/#/);
  });

  test("opens a linked universe and draws in it", async ({ page }) => {
    await page.goto("/conway-multiverse#B3/S12345", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByLabel("Rule", { exact: true })).toHaveText(
      "B3/S12345",
    );
    await expect(page.getByRole("heading", { name: "Maze" })).toBeVisible();
    await page.waitForTimeout(500);

    const population = page.getByLabel("Population");
    await page.getByRole("button", { name: "Pause" }).click();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(population).toHaveText("0");
    await expect(page.getByText("Draw some cells")).toBeVisible();

    await page
      .getByLabel(/Universe B3\/S12345/)
      .click({ position: { x: 40, y: 40 } });
    await expect(population).toHaveText("1");

    // A lone cell has no neighbors to survive with, even in Maze.
    await page.getByRole("button", { name: "Step" }).click();
    await expect(page.getByLabel("Generation", { exact: true })).toHaveText(
      "1",
    );
    await expect(population).toHaveText("0");
  });
});
