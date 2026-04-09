import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChakraProvider } from "@chakra-ui/react";
import { MemoryRouter } from "react-router-dom";
import AuthForm from "../components/AuthForm";

function renderAuthForm(onSubmit = vi.fn()) {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <AuthForm
          title="Вход"
          onSubmit={onSubmit}
          buttonText="Войти"
          fields={[
            {
              name: "username",
              label: "Имя пользователя",
              placeholder: "Введите имя пользователя",
            },
            {
              name: "password",
              label: "Пароль",
              placeholder: "Введите пароль",
              type: "password",
            },
          ]}
          footerText="Нет аккаунта?"
          footerLinkText="Регистрация"
          footerLinkTo="/register"
        />
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe("AuthForm", () => {
  it("renders fields and button", () => {
    renderAuthForm();

    expect(screen.getByText("Вход")).toBeInTheDocument();
    expect(screen.getByLabelText("Имя пользователя")).toBeInTheDocument();
    expect(screen.getByLabelText("Пароль")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeInTheDocument();
  });

  it("submits entered values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderAuthForm(onSubmit);

    await user.type(screen.getByLabelText("Имя пользователя"), "testuser");
    await user.type(screen.getByLabelText("Пароль"), "123456");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        username: "testuser",
        password: "123456",
      });
    });
  });

  it("shows error when submit fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Неверный пароль"));

    renderAuthForm(onSubmit);

    await user.type(screen.getByLabelText("Имя пользователя"), "testuser");
    await user.type(screen.getByLabelText("Пароль"), "wrong");
    await user.click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("Неверный пароль")).toBeInTheDocument();
  });
});