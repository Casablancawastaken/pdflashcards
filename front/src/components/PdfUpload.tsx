import { useState } from "react";
import { Box, Button, Input, Text, VStack } from "@chakra-ui/react";
import { uploadPdf, type UploadResponse } from "../api/upload";
import { useAuth } from "../context/AuthContext";

const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

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
      setError("Вы должны войти в систему, чтобы загружать файлы");
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

  const clearResult = () => setResult(null);

  return (
    <VStack align="stretch" spacing={4}>
      <Input
        type="file"
        accept="application/pdf"
        onChange={onFileChange}
        borderRadius={0}
      />
      <Button onClick={onUpload} isLoading={loading}>
        Загрузить и извлечь текст
      </Button>

      {error && <Text color="red.500">{error}</Text>}

      {result && (
        <Box
          border="1px solid #eee"
          p={4}
          position="relative"
          borderRadius="md"
          bg="gray.50"
        >
          <Button
            size="xs"
            colorScheme="red"
            position="absolute"
            top="4px"
            right="4px"
            onClick={clearResult}
          >
            ✕
          </Button>
          <Text fontWeight="bold" mb={2}>
            Файл: {result.filename}
          </Text>
          <Text whiteSpace="pre-wrap">{result.preview}</Text>
        </Box>
      )}
    </VStack>
  );
};

export default PdfUpload;
