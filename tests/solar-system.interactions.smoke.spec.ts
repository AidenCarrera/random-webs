import { expect, test } from "@playwright/test";

test.describe("solar system interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/solar-system", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: "Solar System Creator" }),
    ).toBeVisible();
    await expect(page.getByText("Initializing Simulation...")).toBeHidden({
      timeout: 20_000,
    });
  });

  test("loads presets and creates, edits, and deletes a planet", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Empty Star" }).click();
    await expect(page.getByText("No celestial bodies in orbit")).toBeVisible();

    await page.getByRole("button", { name: "Create a new Planet" }).click();
    const creator = page.locator("form");
    await creator.locator('input[type="text"]').first().fill("Kepler Test");
    await creator.getByRole("button", { name: "Create Planet" }).click();

    await expect(page.getByText("Kepler Test", { exact: true })).toBeVisible();
    await page.getByText("Kepler Test", { exact: true }).click();

    const editor = page
      .getByRole("heading", { name: "Kepler Test" })
      .locator("..");
    await editor.locator('input[type="text"]').first().fill("Kepler Prime");
    await expect(
      page.getByRole("heading", { name: "Kepler Prime" }),
    ).toBeVisible();

    const renamedEditor = page
      .getByRole("heading", { name: "Kepler Prime" })
      .locator("..");
    await renamedEditor.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("No celestial bodies in orbit")).toBeVisible();
  });

  test("updates simulation and visual controls", async ({ page }) => {
    const pauseButton = page.getByTitle("Pause Simulation");
    await pauseButton.click();
    await expect(page.getByTitle("Resume Simulation")).toBeVisible();

    const timeScale = page.getByRole("slider", { name: "Time scale" });
    await timeScale.fill("2.5");
    await expect(page.getByText("Time Scale: 2.5x")).toBeVisible();

    const orbits = page.getByLabel("Show Orbital Rings");
    await orbits.uncheck();
    await expect(orbits).not.toBeChecked();

    const background = page.getByRole("combobox").first();
    await background.selectOption("stars");
    await expect(background).toHaveValue("stars");
  });
});
