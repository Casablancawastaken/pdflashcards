import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while auth is loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAccessToken: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret page</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Загрузка...")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAccessToken: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Secret page</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("renders children when user is authenticated and role is allowed", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        username: "admin",
        email: "admin@example.com",
        role: "admin",
      },
      token: "token",
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAccessToken: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute roles={["admin"]}>
          <div>Secret page</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Secret page")).toBeInTheDocument();
  });

  it("shows 403 when user role is not allowed", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: {
        username: "user",
        email: "user@example.com",
        role: "user",
      },
      token: "token",
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAccessToken: vi.fn(),
    });

    render(
      <MemoryRouter>
        <ProtectedRoute roles={["admin"]}>
          <div>Admin page</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("403: Недостаточно прав")).toBeInTheDocument();
  });
});