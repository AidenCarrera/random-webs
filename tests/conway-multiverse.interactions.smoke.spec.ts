import { expect, test } from "@playwright/test";

import {
  fitCamera,
  MAX_ZOOM,
  tileRect,
} from "../src/app/conway-multiverse/lib/draw";
import { TILE_X, TILE_Y } from "../src/app/conway-multiverse/lib/multiverse";
import { ruleAt, ruleString } from "../src/app/conway-multiverse/lib/rules";

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

  test("zooms into a corner of the map and pans with a trackpad", async ({
    page,
  }) => {
    await page.goto("/conway-multiverse", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Generation", { exact: true })).not.toHaveText(
      "0",
    );

    const map = page.getByLabel(/^Map of 2,116 life-like universes/);
    const box = (await map.boundingBox())!;
    // The middle of the map's top-left universe.
    const corner = tileRect(fitCamera(box.width, box.height), 0);
    const x = box.x + corner.x + corner.size / 2;
    const y = box.y + corner.y + corner.size / 2;

    // Mouse wheel notches zoom around the cursor, even well past the limit.
    await page.mouse.move(x, y);
    for (let i = 0; i < 40; i += 1) await page.mouse.wheel(0, -100);

    // Trackpad scrolls slide the map instead: one universe down, then one
    // along.
    const at = { clientX: x, clientY: y };
    for (let i = 0; i < MAX_ZOOM; i += 1) {
      await map.dispatchEvent("wheel", {
        ...at,
        deltaY: TILE_Y[1] - TILE_Y[0],
      });
    }
    for (let i = 0; i < MAX_ZOOM; i += 1) {
      await map.dispatchEvent("wheel", {
        ...at,
        deltaX: TILE_X[1] - TILE_X[0],
      });
    }
    // A trackpad pinch zooms around the cursor too.
    for (let i = 0; i < 10; i += 1) {
      await map.dispatchEvent("wheel", { ...at, deltaY: 6, ctrlKey: true });
    }

    await page.mouse.click(x, y);
    await expect(page.getByLabel("Rule", { exact: true })).toHaveText(
      ruleString(ruleAt(1, 1)),
    );
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
