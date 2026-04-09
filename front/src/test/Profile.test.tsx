import { ChakraProvider } from "@chakra-ui/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Profile from "../pages/Profile";

vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/useUploadsStatus", () => ({
  useUploadsStatus: () => ({
    isConnected: true,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

vi.mock("../api/client", () => ({
  apiFetch: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";

const uploadsMock = [
  {
    id: 1,
    filename: "python.pdf",
    title: "Python basics",
    timestamp: "2026-04-01T10:00:00",
    status: "done",
    size: 1024,
    content_type: "application/pdf",
  },
  {
    id: 2,
    filename: "ml.pdf",
    title: "Machine learning",
    timestamp: "2026-04-02T11:00:00",
    status: "uploaded",
    size: 2048,
    content_type: "application/pdf",
  },
  {
    id: 3,
    filename: "go.pdf",
    title: "Go language",
    timestamp: "2026-04-03T12:00:00",
    status: "error",
    size: 3072,
    content_type: "application/pdf",
  },
  {
    id: 4,
    filename: "sql.pdf",
    title: "SQL intro",
    timestamp: "2026-04-04T13:00:00",
    status: "done",
    size: 4096,
    content_type: "application/pdf",
  },
  {
    id: 5,
    filename: "docker.pdf",
    title: "Docker guide",
    timestamp: "2026-04-05T14:00:00",
    status: "done",
    size: 5120,
    content_type: "application/pdf",
  },
];

function renderProfile() {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={["/profile"]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe("Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useAuth).mockReturnValue({
      user: {
        username: "testuser",
        email: "test@example.com",
        role: "user",
      },
      token: "token",
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAccessToken: vi.fn().mockResolvedValue(true),
    });

    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: uploadsMock,
        page: 1,
        pages: 2,
        total: 5,
      }),
    } as Response);
  });

  it("renders uploads list", async () => {
    renderProfile();

    expect(await screen.findByText("Docker guide")).toBeInTheDocument();
    expect(screen.getByText("SQL intro")).toBeInTheDocument();
    expect(screen.getByText("Go language")).toBeInTheDocument();
    expect(screen.getByText("Machine learning")).toBeInTheDocument();
  });

  it("filters uploads by search query", async () => {
    const user = userEvent.setup();
    renderProfile();

    await screen.findByText("Docker guide");

    const searchInput = screen.getByPlaceholderText("Поиск по title или имени файла");
    await user.type(searchInput, "docker");

    await waitFor(() => {
      expect(screen.getByText("Docker guide")).toBeInTheDocument();
    });

    expect(screen.queryByText("Machine learning")).not.toBeInTheDocument();
    expect(screen.queryByText("Go language")).not.toBeInTheDocument();
  });

  it("filters uploads by status", async () => {
    const user = userEvent.setup();
    renderProfile();

    await screen.findByText("Docker guide");

    const statusSelect = screen.getByDisplayValue("Все");
    await user.selectOptions(statusSelect, "error");

    await waitFor(() => {
      expect(screen.getByText("Go language")).toBeInTheDocument();
    });

    expect(screen.queryByText("Docker guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Machine learning")).not.toBeInTheDocument();
  });

  it("supports pagination", async () => {
    const user = userEvent.setup();
    renderProfile();

    await screen.findByText("Docker guide");

    expect(screen.queryByText("Python basics")).not.toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    const nextPageButton = buttons[buttons.length - 1];
    await user.click(nextPageButton);

    await waitFor(() => {
      expect(screen.getByText("Python basics")).toBeInTheDocument();
    });
  });
});