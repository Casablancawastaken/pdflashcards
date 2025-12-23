import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Box, Button, Heading, VStack, Text, HStack, useToast, Icon, Flex, Input, Badge, Spinner} from "@chakra-ui/react";
import { FiFileText, FiTrash2, FiEye, FiCpu, FiClock, FiSearch, FiChevronLeft, FiChevronRight, FiRefreshCw} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useUploadsStatus } from "../api/useUploadsStatus";
import { Link } from "react-router-dom"; 

interface UploadItem {
  id: number;
  filename: string;
  timestamp: string;
  status: "uploaded" | "generating" | "done" | "error";
}

interface StatusEvent {
  upload_id: number;
  status: "uploaded" | "generating" | "done" | "error";
  type: "initial" | "status_update" | "final" | "error";
  finished?: boolean;
  error?: string;
}

const ITEMS_PER_PAGE = 4;

const statusMap = {
  uploaded: { label: "Загружен", color: "gray" },
  generating: { label: "Генерация...", color: "yellow" },
  done: { label: "Готово", color: "green" },
  error: { label: "Ошибка", color: "red" },
} as const;

const Profile = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  const toastIdRef = useRef<string | number | undefined>(undefined);

  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUploads = useCallback(async () => {
    if (!token) return;

    setLoading(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(ITEMS_PER_PAGE),
      search,
    });

    try {
      const r = await fetch(`http://127.0.0.1:8000/uploads/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (r.ok) {
        const data = await r.json();
        setUploads(data.items);
        setPages(data.pages);
      } else {
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить историю файлов",
          status: "error",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Неизвестная ошибка";
        
      toast({
        title: "Ошибка сети",
        description: `Проверьте подключение: ${errorMessage}`,
        status: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, page, search, toast]);

  const sseHandlers = useMemo(() => ({
    onStatusUpdate: (event: StatusEvent) => {
      setUploads(prev => prev.map(upload => 
        upload.id === event.upload_id  ? { ...upload, status: event.status } : upload));
      
      if (event.type === 'initial') {
        return;
      }
      
      if (event.status === 'done' && event.type === 'status_update') {
        if (toastIdRef.current) {
          toast.close(toastIdRef.current);
        }
        
        toastIdRef.current = toast({
          title: "Генерация завершена!",
          description: `Файл готов к просмотру`,
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom-right" as const,
        });
      } else if (event.status === 'error') {
        if (toastIdRef.current) {
          toast.close(toastIdRef.current);
        }
        
        toastIdRef.current = toast({
          title: "Ошибка генерации",
          description: `Не удалось сгенерировать карточки`,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom-right" as const,
        });
      }
    },
    onConnect: () => {
      console.log("SSE подключено - отслеживаем статусы в реальном времени");
    },
    onError: (error: string) => {
      console.error("SSE ошибка:", error);
    },
    onDisconnect: () => {
      console.log("SSE отключено");
    }
  }), [toast]);

  const { isConnected } = useUploadsStatus(sseHandlers);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUploads();
  };

  const handleDelete = async (id: number) => {
    const r = await fetch(`http://127.0.0.1:8000/uploads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.ok) {
      toast({ title: "Файл удалён", status: "success" });
      fetchUploads();
    }
  };

  const handleClearAll = async () => {
    const r = await fetch("http://127.0.0.1:8000/uploads/clear", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (r.ok) {
      toast({ title: "История очищена", status: "success" });
      setUploads([]);
      setPage(1);
      setPages(1);
    }
  };

  return (
    <Box maxW="950px" mx="auto">
      <Box bg="white" borderWidth="1.5px" borderColor="blue.400" borderRadius="xl" boxShadow="sm" p={6} mb={6}>
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
            <Button leftIcon={<FiRefreshCw />} colorScheme="blue" variant="outline" onClick={handleRefresh} isLoading={refreshing}>
              Обновить
            </Button>
            
            <Button leftIcon={<FiTrash2 />} colorScheme="red" variant="outline" onClick={handleClearAll} isDisabled={uploads.length === 0}>
              Очистить историю
            </Button>
          </HStack>
        </Flex>

        <HStack mt={4}>
          <Icon as={FiSearch} color="gray.500" />
          <Input placeholder="Поиск по имени файла" value={search} onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            maxW="300px"
          />
        </HStack>
      </Box>

      {loading && !refreshing && (
        <Flex justify="center" p={10}>
          <Spinner size="lg" color="blue.500" />
        </Flex>
      )}

      {!loading && uploads.length === 0 && (
        <Box borderWidth="2px" borderStyle="dashed" borderColor="blue.300" borderRadius="xl" p={10} textAlign="center" bg="white" color="gray.500">
          <Text fontSize="lg" mb={2}>
            История пуста
          </Text>
          <Text fontSize="sm">
            Загрузите PDF файл на главной странице
          </Text>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {uploads.map((u) => {
          const status = statusMap[u.status];

          return (
            <Box key={u.id} borderWidth="1px" borderRadius="xl" p={5} bg="white"boxShadow="sm" position="relative">
              {u.status === 'generating' && (
                <Box position="absolute" top={-2} right={-2} width={3} height={3} bg="yellow.400" borderRadius="full" animation="pulse 1.5s infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.3 },
                      '100%': { opacity: 1 },
                    }
                  }}
                />
              )}

              <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                <Box minW={0} flex="1">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiFileText} color="blue.500" />
                    <Text fontWeight="bold" isTruncated>
                      {u.filename}
                    </Text>
                    <Badge colorScheme={status.color}>
                      {status.label}
                      {u.status === 'generating' && '...'}
                    </Badge>
                  </HStack>

                  <HStack spacing={2}>
                    <Icon as={FiClock} color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      {new Date(u.timestamp).toLocaleString()}
                    </Text>
                  </HStack>
                </Box>

                <HStack spacing={2}>
                  <Button as={Link} to={`/uploads/${u.id}`}  leftIcon={<FiEye />} size="sm" variant="outline" colorScheme="blue">
                    Просмотр
                  </Button>

                  <Button as={Link} to={`/cards/${u.id}`} leftIcon={<FiCpu />} size="sm" variant="outline" colorScheme="purple" isDisabled={u.status !== 'done'}>
                    Карточки
                  </Button>

                  <Button leftIcon={<FiTrash2 />} size="sm" variant="outline" colorScheme="red" onClick={() => handleDelete(u.id)}>
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
          <Button size="sm" variant="outline" onClick={() => setPage((p) => p - 1)} isDisabled={page === 1}>
            <FiChevronLeft />
          </Button>

          <Text fontSize="sm" color="gray.600">
            {page} / {pages}
          </Text>

          <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} isDisabled={page === pages}>
            <FiChevronRight />
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default Profile;