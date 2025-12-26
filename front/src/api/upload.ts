export interface UploadResponse {
  id: number;
  filename: string;
  preview: string;
}

export async function uploadPdf(file: File, token: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://127.0.0.1:8000/upload-pdf", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, 
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Ошибка при загрузке PDF");
  }

  return await response.json();
}
