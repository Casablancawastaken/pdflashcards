import { useState } from "react";
import { Box, Button, Input, Text, VStack, useToast } from "@chakra-ui/react";
import { uploadPdf, type UploadResponse } from "../api/upload";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const onUpload = async () => {
    if (!file) {
      setError("Выберите PDF-файл");
      return;
    }

    if (!token) {
      setError("Вы должны войти в систему");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const r = await uploadPdf(file, token);
      setResult(r);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  const generateAI = async () => {
    if (!result?.id) return;

    setAiLoading(true);

    try {
      const r = await fetch(
        `http://127.0.0.1:8000/ai/generate_cards/${result.id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (r.ok) {
        toast({ title: "Карточки успешно созданы!", status: "success" });
        navigate(`/cards/${result.id}`);
      } else {
        const data = await r.json().catch(() => ({}));
        toast({
          title: data.detail || "Ошибка генерации",
          status: "error",
        });
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Input type="file" accept="application/pdf" onChange={onFileChange} />

      <Button onClick={onUpload} isLoading={loading}>
        Загрузить PDF
      </Button>

      {error && <Text color="red.500">{error}</Text>}

      {result && (
        <Box border="1px solid #eee" p={4}>
          <Text fontWeight="bold" mb={2}>
            Файл: {result.filename}
          </Text>
          <Text whiteSpace="pre-wrap" maxH="200px" overflow="auto">
            {result.preview}
          </Text>

          <Button
            colorScheme="purple"
            mt={3}
            onClick={generateAI}
            isLoading={aiLoading}
          >
            Сгенерировать карточки (ИИ)
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default PdfUpload;
