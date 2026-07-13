import { expect, test } from "@playwright/test";

test.describe("Olo Terminal interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/olo-terminal", { waitUntil: "domcontentloaded" });

    // The boot screen is server-rendered; wait briefly for its click handler to hydrate.
    await page.waitForTimeout(250);
    await page
      .getByText("[ Press any key or click to skip boot sequence ]", {
        exact: true,
      })
      .click();
    await expect(
      page.getByText("OLO_SHELL_V2.0", { exact: true }),
    ).toBeVisible();
  });

  test("executes commands, redirection, and command-history navigation", async ({
    page,
  }) => {
    const input = page.locator(".olo-shell-input");

    await input.fill('echo "hello terminal"');
    await input.press("Enter");
    await expect(
      page.getByText("hello terminal", { exact: true }),
    ).toBeVisible();

    await input.fill("echo saved > note.txt");
    await input.press("Enter");
    await expect(
      page.getByText("echo saved > note.txt", { exact: true }),
    ).toBeVisible();

    await input.fill("cat note.txt");
    await input.press("Enter");
    await expect(page.getByText("saved", { exact: true })).toBeVisible();

    await input.press("ArrowUp");
    await expect(input).toHaveValue("cat note.txt");
  });

  test("changes themes and toggles Matrix mode", async ({ page }) => {
    await page.getByRole("button", { name: "Open settings" }).click();
    await page.getByTitle("Amber").click();

    const terminalPage = page.locator("div.min-h-screen").first();
    await expect(terminalPage).toHaveCSS("background-color", "rgb(23, 19, 15)");

    const input = page.locator(".olo-shell-input");
    await input.fill("matrix");
    await input.press("Enter");

    await expect(
      page.getByText("Wake up, Neo...", { exact: true }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
  });
});
