import { apiFetch } from "./client";

export interface UploadResponse {
  id: number;
  filename: string;
}

export async function uploadPdf(
  file: File,
  accessToken: string,
  refresh: () => Promise<boolean>
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiFetch(
    "/upload-pdf",
    {
      method: "POST",
      body: formData,
      accessToken,
    },
    refresh
  );

  if (!response.ok) {
    throw new Error("Ошибка при загрузке PDF");
  }

  return await response.json();
}