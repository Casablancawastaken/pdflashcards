import { test, expect } from "@playwright/test";

test("user can navigate between main page and login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Генерация карточек из PDF")).toBeVisible();

  await page.getByRole("link", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Вход")).toBeVisible();
});

test("user can open register page", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Регистрация" }).click();
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByText("Регистрация")).toBeVisible();
});