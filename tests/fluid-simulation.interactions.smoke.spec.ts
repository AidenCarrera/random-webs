import { expect, test, type Page } from "@playwright/test";

async function openSettings(page: Page) {
  const canvas = page.getByLabel(
    "Interactive GPU particle fluid. Left-drag to stir the flow and right-drag to attract particles.",
  );
  await expect(canvas).toBeVisible();
  await page.getByRole("button", { name: "Open fluid settings" }).click();
  await expect(
    page.getByRole("complementary", { name: "Fluid settings" }),
  ).toBeVisible();
}

test.describe("Fluid Simulation interactions", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/fluid-simulation", { waitUntil: "domcontentloaded" });
    await openSettings(page);
  });

  test("switches motion models and exposes lower particle counts", async ({
    page,
  }) => {
    await expect(
      page.getByText(
        "Settings save automatically; R resets, Space pauses, M mutes, and scrolling adjusts stroke force.",
      ),
    ).toBeVisible();

    const particleCount = page.getByLabel("Particles", { exact: true });
    await expect(particleCount).toHaveValue("262144");
    expect(await particleCount.locator("option").allTextContents()).toEqual([
      "32K",
      "65K",
      "131K",
      "262K",
      "524K",
      "1.05M",
    ]);

    await particleCount.selectOption("32768");
    await expect(particleCount).toHaveValue("32768");
    await particleCount.selectOption("65536");
    await expect(particleCount).toHaveValue("65536");

    const motionModel = page.getByLabel("Particle motion", { exact: true });
    await expect(motionModel).toHaveValue("fluid");
    expect(await motionModel.locator("option").allTextContents()).toEqual([
      "Fluid tracers",
      "Fluid particles",
    ]);

    await motionModel.selectOption("classic");
    await expect(motionModel).toHaveValue("classic");
    await motionModel.selectOption("fluid");
    await expect(motionModel).toHaveValue("fluid");
  });

  test("supports keyboard and wheel controls", async ({ page }) => {
    await page.keyboard.press("Space");
    await expect(
      page.getByRole("button", { name: "Resume simulation" }),
    ).toBeVisible();

    await page.keyboard.press("m");
    await expect(
      page.getByRole("button", { name: "Play music" }),
    ).toHaveAttribute("aria-pressed", "false");

    const force = page.getByLabel("Stroke force", { exact: true });
    await expect(force).toHaveValue("1");
    await page
      .getByLabel(
        "Interactive GPU particle fluid. Left-drag to stir the flow and right-drag to attract particles.",
      )
      .hover();
    await page.mouse.wheel(0, -100);
    await expect(force).toHaveValue("1.1");
    await page.mouse.wheel(0, 100);
    await expect(force).toHaveValue("1");

    await page.keyboard.press("r");
    await expect(
      page.getByRole("button", { name: "Reset simulation" }),
    ).toBeVisible();
  });

  test("restores saved settings after a reload", async ({ page }) => {
    await page.getByLabel("Particles", { exact: true }).selectOption("65536");
    await page
      .getByLabel("Particle motion", { exact: true })
      .selectOption("classic");
    await page.getByLabel("Color", { exact: true }).selectOption("fire");
    await page.getByLabel("Iterations", { exact: true }).fill("36");
    await page.getByLabel("Stroke force", { exact: true }).fill("1.7");
    await page.getByRole("button", { name: "Mute music" }).click();

    await expect
      .poll(() =>
        page.evaluate(() =>
          JSON.parse(
            window.localStorage.getItem("fluid-simulation-settings-v1") ??
              "null",
          ),
        ),
      )
      .toMatchObject({
        solverIterations: 36,
        particleCount: 65_536,
        force: 1.7,
        colorPreset: "fire",
        motionModel: "classic",
        musicEnabled: false,
      });

    await page.reload({ waitUntil: "domcontentloaded" });
    await openSettings(page);

    await expect(page.getByLabel("Particles", { exact: true })).toHaveValue(
      "65536",
    );
    await expect(
      page.getByLabel("Particle motion", { exact: true }),
    ).toHaveValue("classic");
    await expect(page.getByLabel("Color", { exact: true })).toHaveValue("fire");
    await expect(page.getByLabel("Iterations", { exact: true })).toHaveValue(
      "36",
    );
    await expect(page.getByLabel("Stroke force", { exact: true })).toHaveValue(
      "1.7",
    );
    await expect(
      page.getByRole("button", { name: "Play music" }),
    ).toHaveAttribute("aria-pressed", "false");
  });
});
