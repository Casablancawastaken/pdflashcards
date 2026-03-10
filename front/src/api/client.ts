const API_URL = "http://127.0.0.1:8000";

export async function apiFetch(
  path: string,
  init: RequestInit & { accessToken?: string | null } = {},
  refresh?: () => Promise<boolean>
) {
  const headers = new Headers(init.headers || {});
  if (init.accessToken) headers.set("Authorization", `Bearer ${init.accessToken}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status !== 401 || !refresh) return res;

  const ok = await refresh();
  if (!ok) return res;

  const headers2 = new Headers(init.headers || {});
  const newAccess = localStorage.getItem("access_token");
  if (newAccess) headers2.set("Authorization", `Bearer ${newAccess}`);

  return fetch(`${API_URL}${path}`, { ...init, headers: headers2 });
}