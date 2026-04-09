import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Button,
  Input,
  VStack,
  HStack,
  useToast,
  SimpleGrid,
  Image,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/client";
import Seo from "../components/Seo";
import { fetchBooksByUpload, type BookItem } from "../api/books";

interface UploadDetailData {
  id: number;
  filename: string;
  title: string;
  text: string;
  size: number;
  content_type: string;
  timestamp: string;
  status: string;
}

const UploadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { token, refreshAccessToken } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState<UploadDetailData | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [books, setBooks] = useState<BookItem[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await apiFetch(`/uploads/${id}/text`, { accessToken: token }, refreshAccessToken);
        if (r.ok) {
          const json = await r.json();
          setData(json);
          setTitle(json.title);
        } else {
          setError("Ошибка загрузки текста PDF");
        }
      } catch (e: unknown) {
        if (e instanceof Error) setError("Ошибка сети: " + e.message);
        else setError("Неизвестная ошибка сети");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) fetchData();
  }, [id, token, refreshAccessToken]);

  useEffect(() => {
    const loadBooks = async () => {
      if (!id || !token || !data) return;

      setBooksLoading(true);
      setBooksError(null);

      try {
        const items = await fetchBooksByUpload(id, token, refreshAccessToken);
        setBooks(items);
      } catch (e) {
        if (e instanceof Error) setBooksError(e.message);
        else setBooksError("Внешний API недоступен");
      } finally {
        setBooksLoading(false);
      }
    };

    loadBooks();
  }, [id, token, refreshAccessToken, data]);

  const saveTitle = async () => {
    if (!id) return;

    const trimmed = title.trim();
    if (!trimmed) {
      toast({ title: "Название не может быть пустым", status: "error" });
      return;
    }

    setSaving(true);
    try {
      const r = await apiFetch(
        `/uploads/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: trimmed }),
          accessToken: token,
        },
        refreshAccessToken
      );

      const json = await r.json().catch(() => ({}));
      if (r.ok) {
        setData((prev) => (prev ? { ...prev, title: json.title } : prev));
        setTitle(json.title);
        toast({ title: "Название обновлено", status: "success" });
      } else {
        toast({ title: json.detail || "Ошибка сохранения", status: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const openFile = async () => {
    if (!id) return;

    setDownloading(true);
    try {
      const r = await apiFetch(`/uploads/${id}/download-url`, { accessToken: token }, refreshAccessToken);
      const json = await r.json().catch(() => ({}));

      if (r.ok && json.url) {
        window.open(json.url, "_blank", "noopener,noreferrer");
      } else {
        toast({ title: json.detail || "Не удалось открыть файл", status: "error" });
      }
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Text color="red.500">{error}</Text>;
  if (!data) return null;

  return (
    <Box>
      <Seo
        title={`${data.title} | pdflashcards`}
        description={`Просмотр PDF: ${data.title}`}
        canonical={`${window.location.origin}/uploads/${id}`}
        noindex
      />

      <Button mb={4} onClick={() => navigate(-1)}>
        ← Назад
      </Button>

      <VStack align="stretch" spacing={4} mb={6}>
        <Heading>{data.title}</Heading>

        <Text color="gray.500">Исходное имя файла: {data.filename}</Text>
        <Text color="gray.500">Статус: {data.status}</Text>
        <Text color="gray.500">Дата: {new Date(data.timestamp).toLocaleString()}</Text>

        <HStack>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название записи" maxLength={120} />
          <Button colorScheme="blue" onClick={saveTitle} isLoading={saving}>
            Сохранить
          </Button>
          <Button variant="outline" onClick={openFile} isLoading={downloading}>
            Открыть PDF
          </Button>
        </HStack>
      </VStack>

      <Text whiteSpace="pre-wrap" border="1px solid #ddd" p={4} borderRadius="md" maxH="70vh" overflowY="auto">
        {data.text || "(Нет текста в PDF)"}
      </Text>

      <Box mt={8}>
        <Heading size="md" mb={4}>
          Связанные книги
        </Heading>

        {booksLoading && <Text color="gray.500">Загрузка внешних данных...</Text>}

        {!booksLoading && booksError && (
          <Text color="gray.500">
            Внешний сервис сейчас недоступен. Основной функционал страницы работает без него.
          </Text>
        )}

        {!booksLoading && !booksError && books.length === 0 && <Text color="gray.500">Ничего не найдено</Text>}

        {!booksLoading && !booksError && books.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {books.map((book) => (
              <Box key={book.id} borderWidth="1px" borderRadius="xl" p={4} bg="white">
                {book.thumbnail && (
                  <Image
                    src={book.thumbnail}
                    alt={book.title}
                    loading="lazy"
                    mb={3}
                    borderRadius="md"
                  />
                )}

                <Heading size="sm" mb={2}>
                  {book.title}
                </Heading>

                {book.authors?.length > 0 && (
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Авторы: {book.authors.join(", ")}
                  </Text>
                )}

                {book.description && (
                  <Text fontSize="sm" color="gray.700" noOfLines={4}>
                    {book.description}
                  </Text>
                )}

                {book.info_url && (
                  <Button
                    as="a"
                    href={book.info_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    mt={3}
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                  >
                    Открыть
                  </Button>
                )}
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
};

export default UploadDetail;