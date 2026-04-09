import { apiFetch } from "./client";

export interface BookItem {
  id: string;
  title: string;
  authors: string[];
  description: string;
  thumbnail?: string;
  info_url?: string;
  published_date?: string;
}

export async function fetchBooksByUpload(
  uploadId: string,
  accessToken: string | null,
  refresh: () => Promise<boolean>
): Promise<BookItem[]> {
  const r = await apiFetch(`/books/by-upload/${uploadId}`, { accessToken }, refresh);

  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.detail || "Ошибка внешнего API");
  }

  const data = await r.json();
  return data.items || [];
}