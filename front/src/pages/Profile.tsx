import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  VStack,
  Text,
  HStack,
  useToast,
  Divider,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

interface UploadItem {
  id: number;
  filename: string;
  preview: string;
  timestamp: string;
}

const Profile = () => {
  const { token, user } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const toast = useToast();

  // Загружаем историю
  const fetchUploads = async () => {
    const r = await fetch("http://127.0.0.1:8000/uploads/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      setUploads(await r.json());
    }
  };

  useEffect(() => {
    if (token) fetchUploads();
  }, [token]);

  // Удаление одного файла
  const handleDelete = async (id: number) => {
    const r = await fetch(`http://127.0.0.1:8000/uploads/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      toast({ title: "Файл удалён", status: "success" });
      setUploads((prev) => prev.filter((u) => u.id !== id));
    } else {
      toast({ title: "Ошибка удаления", status: "error" });
    }
  };

  // Очистка всей истории
  const handleClearAll = async () => {
    const r = await fetch("http://127.0.0.1:8000/uploads/clear", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      toast({ title: "История очищена", status: "success" });
      setUploads([]);
    } else {
      toast({ title: "Ошибка очистки", status: "error" });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Профиль: {user?.username}
      </Heading>

      <Button colorScheme="red" mb={4} onClick={handleClearAll}>
        Очистить историю
      </Button>

      <VStack align="stretch" spacing={4}>
        {uploads.length === 0 && <Text>История загрузок пуста</Text>}
        {uploads.map((u) => (
          <Box key={u.id} border="1px solid #ccc" p={3} borderRadius="md">
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="bold">{u.filename}</Text>
                <Text fontSize="sm" color="gray.500">
                  {new Date(u.timestamp).toLocaleString()}
                </Text>
              </Box>
              <HStack>
                <Button
                  colorScheme="blue"
                  variant="outline"
                  onClick={() => (window.location.href = `/uploads/${u.id}`)}
                >
                  Посмотреть
                </Button>
                  <Button colorScheme="purple" variant="outline" onClick={() => (window.location.href = `/uploads/${u.id}/cards`)}>
                  Карточки
                </Button>
                <Button colorScheme="red" variant="outline" onClick={() => handleDelete(u.id)}>
                  Удалить
                </Button>
              </HStack>
            </HStack>
          </Box>
        ))}
      </VStack>
      <Divider my={6} />
    </Box>
  );
};

export default Profile;
