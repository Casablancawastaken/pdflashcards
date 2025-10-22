import { useEffect, useState } from "react";
import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

interface UploadItem {
  id: number;
  filename: string;
  timestamp: string;
}

const Profile = () => {
  const { user, token, logout } = useAuth();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("http://127.0.0.1:8000/uploads/", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setUploads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (!user) return null;

  return (
    <Box maxW="md" mx="auto" p={6} border="1px solid #eee" borderRadius="lg" boxShadow="sm">
      <VStack spacing={4} align="stretch">
        <Heading size="md" textAlign="center">
          Профиль пользователя
        </Heading>

        <Box>
          <Text>
            <strong>Имя пользователя:</strong> {user.username}
          </Text>
          <Text>
            <strong>Email:</strong> {user.email}
          </Text>
        </Box>

        <Heading size="sm" mt={4}>
          История загрузок
        </Heading>

        {loading ? (
          <Text>Загрузка...</Text>
        ) : uploads.length === 0 ? (
          <Text>Загрузок пока нет.</Text>
        ) : (
          uploads.map((u) => (
            <Box
              key={u.id}
              p={3}
              border="1px solid #ddd"
              borderRadius="md"
              _hover={{ bg: "gray.50" }}
            >
              <Text fontWeight="bold">{u.filename}</Text>
              <Text fontSize="sm" color="gray.500">
                {new Date(u.timestamp).toLocaleString()}
              </Text>
            </Box>
          ))
        )}

        <Button colorScheme="red" onClick={logout}>
          Выйти
        </Button>
      </VStack>
    </Box>
  );
};

export default Profile;
