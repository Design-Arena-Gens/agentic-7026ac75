import { expect, test } from "@playwright/test";

test("loads arena planner overview", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Arena Target Assignment Check" })
  ).toBeVisible();
  await expect(page.getByText("Arena Envelope").first()).toBeVisible();
  await expect(page.getByText("Coverage Health")).toBeVisible();
});
