import { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  Heading,
  Icon,
  useToast,
} from "@chakra-ui/react";
import { FiUploadCloud, FiCpu } from "react-icons/fi";
import { uploadPdf, type UploadResponse } from "../api/upload";
import { useAuth } from "../context/AuthContext";


const PdfUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { token } = useAuth();
  const toast = useToast();


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
      toast({ title: "PDF успешно загружен", status: "success" });
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
        toast({ title: "Генерация завершена", description: "Перейдите в историю", status: "success", duration: 4000 });
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

  // --- Drag & Drop handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setResult(null);
      setError(null);
    } else {
      setError("Можно загрузить только PDF-файл");
    }
  };

  return (
    <VStack spacing={10} align="stretch">
      {/* Заголовок */}
      <Box textAlign="center">
        <Heading size="lg" mb={2}>
          Генерация карточек из PDF
        </Heading>
        <Text color="gray.600">
          Загрузите PDF-файл — мы создадим учебные карточки автоматически
        </Text>
      </Box>

      {/* Зона загрузки + drag & drop */}
      <Box
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragging ? "blue.500" : "blue.300"}
        borderRadius="xl"
        p={10}
        bg={isDragging ? "blue.50" : "white"}
        textAlign="center"
        transition="all 0.2s"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <VStack spacing={4}>
          <Icon as={FiUploadCloud} boxSize={12} color="blue.500" />

          <Text fontSize="lg" fontWeight="medium">
            {isDragging ? "Отпустите файл для загрузки" : "Выберите PDF файл"}
          </Text>

          <Text fontSize="sm" color="gray.500">
            Поддерживается только формат PDF
          </Text>

          <Input
            type="file"
            accept="application/pdf"
            display="none"
            id="pdf-upload"
            onChange={onFileChange}
          />

          <Button
            as="label"
            htmlFor="pdf-upload"
            colorScheme="blue"
            variant="outline"
            cursor="pointer"
          >
            Выбрать файл
          </Button>

          {file && (
            <Text fontSize="sm" color="gray.600">
              Выбран файл: <b>{file.name}</b>
            </Text>
          )}
        </VStack>
      </Box>

      {/* Загрузка PDF */}
      <Button
        colorScheme="blue"
        size="lg"
        onClick={onUpload}
        isLoading={loading}
      >
        Загрузить PDF
      </Button>

      {error && <Text color="red.500">{error}</Text>}

      {/* Главная кнопка генерации */}
      {result && (
        <Box textAlign="center">
          <Button
            colorScheme="blue"
            size="lg"
            px={16}
            py={7}
            fontSize="lg"
            leftIcon={<FiCpu />}
            onClick={generateAI}
            isLoading={aiLoading}
          >
            Сгенерировать карточки
          </Button>
        </Box>
      )}
    </VStack>
  );
};

export default PdfUpload;
