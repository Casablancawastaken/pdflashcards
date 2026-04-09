import { test, expect } from "@playwright/test";

test("redirects unauthenticated user from profile to login", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login/);
});

test("user can open login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Вход")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});