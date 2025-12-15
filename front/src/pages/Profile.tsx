import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  HStack,
  useToast,
  Icon,
  Flex,
  Input,
  Badge,
} from "@chakra-ui/react";
import {
  FiFileText,
  FiTrash2,
  FiEye,
  FiCpu,
  FiClock,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

interface UploadItem {
  id: number;
  filename: string;
  timestamp: string;
  status?: "uploaded" | "generating" | "done" | "error";
}

const ITEMS_PER_PAGE = 4;

const statusMap = {
  uploaded: { label: "Загружен", color: "gray" },
  generating: { label: "Генерируется", color: "yellow" },
  done: { label: "Готово", color: "green" },
  error: { label: "Ошибка", color: "red" },
} as const;

const Profile = () => {
  const { token, user } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const toast = useToast();

  const fetchUploads = async () => {
    const r = await fetch("http://127.0.0.1:8000/uploads/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      setUploads(await r.json());
    }
  };


  useEffect(() => {
    if (!token) return;

    fetchUploads();
    const interval = setInterval(fetchUploads, 3000);

    return () => clearInterval(interval);
  }, [token]);

  const filteredUploads = useMemo(() => {
    return uploads.filter((u) =>
      u.filename.toLowerCase().includes(search.toLowerCase())
    );
  }, [uploads, search]);

  const totalPages = Math.ceil(filteredUploads.length / ITEMS_PER_PAGE);

  const paginatedUploads = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUploads.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUploads, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleDelete = async (id: number) => {
    const r = await fetch(`http://127.0.0.1:8000/uploads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      toast({ title: "Файл удалён", status: "success" });
      setUploads((prev) => prev.filter((u) => u.id !== id));
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
            </Text>
          </Box>

          <Button
            leftIcon={<FiTrash2 />}
            colorScheme="red"
            variant="outline"
            onClick={handleClearAll}
            isDisabled={uploads.length === 0}
          >
            Очистить историю
          </Button>
        </Flex>

        <HStack mt={4}>
          <Icon as={FiSearch} color="gray.500" />
          <Input
            placeholder="Поиск по имени файла"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxW="300px"
          />
        </HStack>
      </Box>

      {filteredUploads.length === 0 && (
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
          <Text fontSize="sm">
            Попробуйте изменить поисковый запрос
          </Text>
        </Box>
      )}

      <VStack spacing={4} align="stretch">
        {paginatedUploads.map((u) => {
          const statusKey = u.status ?? "uploaded";
          const status = statusMap[statusKey];

          return (
            <Box
              key={u.id}
              borderWidth="1px"
              borderRadius="xl"
              p={5}
              bg="white"
              boxShadow="sm"
            >
              <Flex justify="space-between" align="center" gap={4} wrap="wrap">
                <Box minW={0} flex="1">
                  <HStack spacing={2} mb={2}>
                    <Icon as={FiFileText} color="blue.500" />
                    <Text fontWeight="bold" isTruncated>
                      {u.filename}
                    </Text>
                    <Badge colorScheme={status.color}>
                      {status.label}
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
                  <Button
                    leftIcon={<FiEye />}
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => (window.location.href = `/uploads/${u.id}`)}
                  >
                    Просмотр
                  </Button>

                  <Button
                    leftIcon={<FiCpu />}
                    size="sm"
                    variant="outline"
                    colorScheme="purple"
                    onClick={() => (window.location.href = `/cards/${u.id}`)}
                    isDisabled={statusKey !== "done"}
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

      {totalPages > 1 && (
        <HStack justify="center" mt={6} spacing={3}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p - 1)}
            isDisabled={page === 1}
          >
            <FiChevronLeft />
          </Button>

          <Text fontSize="sm" color="gray.600">
            {page} / {totalPages}
          </Text>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            isDisabled={page === totalPages}
          >
            <FiChevronRight />
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default Profile;
