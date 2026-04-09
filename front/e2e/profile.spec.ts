import { test, expect } from "@playwright/test";

test("login page contains required fields", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByText("Вход")).toBeVisible();
  await expect(page.getByLabel("Имя пользователя")).toBeVisible();
  await expect(page.getByLabel("Пароль")).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти" })).toBeVisible();
});

test("profile redirects to login if user is not authenticated", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login/);
});

test("home page shows upload UI", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Генерация карточек из PDF")).toBeVisible();
  await expect(page.getByText("Выберите PDF файл")).toBeVisible();
  await expect(page.getByText("Выбрать файл")).toBeVisible();
});