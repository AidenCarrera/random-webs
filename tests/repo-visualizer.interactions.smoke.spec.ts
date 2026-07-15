import { expect, test } from "@playwright/test";

test.describe("Repository Visualizer loading and playback", () => {
  test("keeps playback disabled until the repository history is ready", async ({
    page,
  }) => {
    await page.route("**/repo-visualizer/demo-git-log.txt", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ status: 404, body: "Demo log unavailable" });
    });

    await page.goto("/repo-visualizer", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("status")).toContainText(
      "Loading repository history",
    );
    await expect(
      page.getByRole("button", {
        name: "Playback unavailable while repository loads",
      }),
    ).toBeDisabled();
    await expect(
      page.getByLabel("Repository statistics loading"),
    ).toHaveAttribute("aria-busy", "true");
    await expect(page.getByTestId("timeline-progress")).toHaveCSS(
      "width",
      "0px",
    );
    await expect(page.getByText("Press Play to begin simulation")).toHaveCount(
      0,
    );

    const playButton = page.getByRole("button", { name: "Start playback" });
    await expect(playButton).toBeEnabled();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByTestId("timeline-progress")).toHaveCSS(
      "width",
      "0px",
    );
    await expect(
      page.getByText("Press Play to begin simulation"),
    ).toBeVisible();

    await playButton.click();
    await expect(
      page.getByRole("button", { name: "Pause playback" }),
    ).toBeVisible();
  });
});
