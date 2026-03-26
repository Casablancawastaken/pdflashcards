import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Box, Button, Heading, VStack, Text, HStack, useToast, Icon, Flex, Input, Badge, Spinner, Select, SimpleGrid } from "@chakra-ui/react";
import { FiFileText, FiTrash2, FiEye, FiCpu, FiClock, FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useUploadsStatus } from "../api/useUploadsStatus";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";

interface UploadItem {
  id: number;
  filename: string;
  title: string;
  timestamp: string;
  status: "uploaded" | "generating" | "done" | "error";
  size: number;
  content_type: string;
}

interface StatusEvent {
  upload_id: number;
  status: "uploaded" | "generating" | "done" | "error";
  type: "initial" | "status_update" | "final" | "error";
}

const ITEMS_PER_PAGE = 4;

const statusMap = {
  uploaded: { label: "Загружен", color: "gray" },
  generating: { label: "Генерация", color: "yellow" },
  done: { label: "Готово", color: "green" },
  error: { label: "Ошибка", color: "red" },
} as const;

const formatSize = (size: number) => {
  if (size < 1024) return `${size} Б`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
};

const Profile = () => {
  const { token, user, refreshAccessToken } = useAuth();
  const toast = useToast();
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const [allUploads, setAllUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const sortBy = searchParams.get("sortBy") || "timestamp_desc";
  const page = Number(searchParams.get("page") || "1");

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);

    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const fetchUploads = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    try {
      const r = await apiFetch(
        `/uploads/?page=1&limit=1000&sort_by=timestamp&order=desc`,
        { accessToken: token },
        refreshAccessToken
      );

      if (r.ok) {
        const data = await r.json();
        setAllUploads(data.items);
      } else {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить историю файлов",
          status: "error",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      toast({
        title: "Ошибка сети",
        description: `Проверьте подключение: ${errorMessage}`,
        status: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, toast, refreshAccessToken]);

  const sseHandlers = useMemo(
    () => ({
      onStatusUpdate: (event: StatusEvent) => {
        setAllUploads((prev) =>
          prev.map((upload) => (upload.id === event.upload_id ? { ...upload, status: event.status } : upload))
        );

        if (event.type === "initial") return;

        if (event.status === "done" && event.type === "status_update") {
          if (toastIdRef.current) toast.close(toastIdRef.current);

          toastIdRef.current = toast({
            title: "Генерация завершена!",
            description: "Файл готов к просмотру",
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "bottom-right",
          });
        } else if (event.status === "error") {
          if (toastIdRef.current) toast.close(toastIdRef.current);

          toastIdRef.current = toast({
            title: "Ошибка генерации",
            description: "Не удалось сгенерировать карточки",
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "bottom-right",
          });
        }
      },
    }),
    [toast]
  );

  const { isConnected } = useUploadsStatus(sseHandlers);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const filteredUploads = useMemo(() => {
    let data = [...allUploads];

    const searchLower = search.trim().toLowerCase();
    if (searchLower) {
      data = data.filter(
        (u) =>
          u.filename.toLowerCase().includes(searchLower) ||
          u.title.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter((u) => u.status === statusFilter);
    }

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`).getTime();
      data = data.filter((u) => new Date(u.timestamp).getTime() >= from);
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`).getTime();
      data = data.filter((u) => new Date(u.timestamp).getTime() <= to);
    }

    switch (sortBy) {
      case "timestamp_asc":
        data.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        break;
      case "title_asc":
        data.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        data.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "size_asc":
        data.sort((a, b) => a.size - b.size);
        break;
      case "size_desc":
        data.sort((a, b) => b.size - a.size);
        break;
      default:
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    return data;
  }, [allUploads, search, statusFilter, dateFrom, dateTo, sortBy]);

  const pages = Math.max(1, Math.ceil(filteredUploads.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, pages);
  const uploads = filteredUploads.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (page !== safePage) {
      setParam("page", String(safePage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, safePage]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUploads();
  };

  const handleDelete = async (id: number) => {
    if (!token) return;

    const r = await apiFetch(`/uploads/${id}`, { method: "DELETE", accessToken: token }, refreshAccessToken);
    if (r.ok) {
      toast({ title: "Файл удалён", status: "success" });
      fetchUploads();
    }
  };

  const handleClearAll = async () => {
    if (!token) return;

    const r = await apiFetch(`/uploads/clear`, { method: "DELETE", accessToken: token }, refreshAccessToken);

    if (r.ok) {
      toast({ title: "История очищена", status: "success" });
      setAllUploads([]);
      const next = new URLSearchParams(searchParams);
      next.set("page", "1");
      setSearchParams(next);
    }
  };

  return (
    <Box maxW="950px" mx="auto">
      <Box
        bg="white"
        borderWidth="1.5px"
        borderColor="blue.400"
        borderRadius="xl"
        boxShadow="sm"
        p={6}
        mb={6}
      >
        <Flex justify="space-between" align="center" gap={4} wrap="wrap">
          <Box>
            <Heading size="lg" mb={1}>
              История файлов
            </Heading>
            <Text color="gray.600">
              Пользователь: <b>{user?.username}</b>
              <Badge ml={2} colorScheme={isConnected ? "green" : "gray"}>
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </Text>
          </Box>

          <HStack>
            <Button
              leftIcon={<FiRefreshCw />}
              colorScheme="blue"
              variant="outline"
              onClick={handleRefresh}
              isLoading={refreshing}
            >
              Обновить
            </Button>

            <Button
              leftIcon={<FiTrash2 />}
              colorScheme="red"
              variant="outline"
              onClick={handleClearAll}
              isDisabled={allUploads.length === 0}
            >
              Очистить историю
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">Поиск</Text>
            <HStack>
              <Icon as={FiSearch} color="gray.500" />
              <Input
                placeholder="Поиск по title или имени файла"
                value={search}
                onChange={(e) => setParam("search", e.target.value)}
              />
            </HStack>
          </Box>

          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">Статус</Text>
            <Select value={statusFilter} onChange={(e) => setParam("status", e.target.value)}>
              <option value="all">Все</option>
              <option value="uploaded">Загружен</option>
              <option value="generating">Генерация</option>
              <option value="done">Готово</option>
              <option value="error">Ошибка</option>
            </Select>
          </Box>

          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">Дата от</Text>
            <Input type="date" value={dateFrom} onChange={(e) => setParam("dateFrom", e.target.value)} />
          </Box>

          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">Дата до</Text>
            <Input type="date" value={dateTo} onChange={(e) => setParam("dateTo", e.target.value)} />
          </Box>

          <Box>
            <Text mb={1} fontSize="sm" color="gray.600">Сортировка</Text>
            <Select value={sortBy} onChange={(e) => setParam("sortBy", e.target.value)}>
              <option value="timestamp_desc">Сначала новые</option>
              <option value="timestamp_asc">Сначала старые</option>
              <option value="title_asc">Название A-Я</option>
              <option value="title_desc">Название Я-A</option>
              <option value="size_asc">Размер по возрастанию</option>
              <option value="size_desc">Размер по убыванию</option>
            </Select>
          </Box>
        </SimpleGrid>
      </Box>

      {loading && !refreshing && (
        <Flex justify="center" p={10}>
          <Spinner size="lg" color="blue.500" />
        </Flex>
      )}

      {!loading && uploads.length === 0 && (
        <Box
          borderWidth="2px"
          borderStyle="dashed"
          borderColor="blue.300"
          borderRadius="xl"
          p={10}
          textAlign="center"
          bg="white"
          color="gray.500"
        >
          <Text fontSize="lg" mb={2}>
            Ничего не найдено
          </Text>
          <Text fontSize="sm">Измените фильтры или загрузите PDF на главной странице</Text>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {uploads.map((u) => {
          const status = statusMap[u.status];

          return (
            <Box
              key={u.id}
              borderWidth="1px"
              borderRadius="xl"
              p={5}
              bg="white"
              boxShadow="sm"
              position="relative"
            >
              <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                <Box minW={0} flex="1">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiFileText} color="blue.500" />
                    <Text fontWeight="bold" isTruncated>
                      {u.title}
                    </Text>
                    <Badge colorScheme={status.color}>
                      {status.label}
                    </Badge>
                  </HStack>

                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Исходный файл: {u.filename}
                  </Text>

                  <HStack spacing={4} wrap="wrap">
                    <HStack spacing={2}>
                      <Icon as={FiClock} color="gray.500" />
                      <Text fontSize="sm" color="gray.500">
                        {new Date(u.timestamp).toLocaleString()}
                      </Text>
                    </HStack>

                    <Text fontSize="sm" color="gray.500">
                      Размер: {formatSize(u.size)}
                    </Text>
                  </HStack>
                </Box>

                <HStack spacing={2}>
                  <Button
                    as={Link}
                    to={`/uploads/${u.id}`}
                    leftIcon={<FiEye />}
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                  >
                    Просмотр
                  </Button>

                  <Button
                    as={Link}
                    to={`/cards/${u.id}`}
                    leftIcon={<FiCpu />}
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    isDisabled={u.status !== "done"}
                  >
                    Карточки
                  </Button>

                  <Button
                    leftIcon={<FiTrash2 />}
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => handleDelete(u.id)}
                  >
                    Удалить
                  </Button>
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </VStack>

      {pages > 1 && (
        <HStack justify="center" mt={6} spacing={3}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setParam("page", String(Math.max(1, safePage - 1)))}
            isDisabled={safePage === 1}
          >
            <FiChevronLeft />
          </Button>

          <Text fontSize="sm" color="gray.600">
            {safePage} / {pages}
          </Text>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setParam("page", String(Math.min(pages, safePage + 1)))}
            isDisabled={safePage === pages}
          >
            <FiChevronRight />
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default Profile;