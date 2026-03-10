import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;

  token: string | null;

  loading: boolean;

  login: (tokens: { access_token: string; refresh_token: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem("access_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refresh_token"));

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    fetch("http://127.0.0.1:8000/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: User) => setUser(data))
      .catch(() => {
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (accessToken) localStorage.setItem("access_token", accessToken);
    else localStorage.removeItem("access_token");

    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    else localStorage.removeItem("refresh_token");
  }, [accessToken, refreshToken]);

  const login = async (tokens: { access_token: string; refresh_token: string }) => {
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);

    const r = await fetch("http://127.0.0.1:8000/auth/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (r.ok) {
      const data: User = await r.json();
      setUser(data);
      navigate("/");
    } else {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    const rt = refreshToken || localStorage.getItem("refresh_token");
    if (!rt) return false;

    const r = await fetch("http://127.0.0.1:8000/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: rt }),
    });

    if (!r.ok) {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      return false;
    }

    const data = (await r.json()) as { access_token: string; refresh_token: string };
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    return true;
  };

  const logout = async () => {
    const rt = refreshToken || localStorage.getItem("refresh_token");
    if (rt) {
      await fetch("http://127.0.0.1:8000/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt, all_sessions: false }),
      }).catch(() => {});
    }

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: accessToken,
        loading,
        login,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};