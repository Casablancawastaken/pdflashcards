import { useState } from "react";
import { Box, Button, Heading, Input, Select, Text, VStack, useToast } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

const Admin = () => {
  const { token } = useAuth();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim()) {
      toast({ title: "Введите username", status: "error" });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("http://127.0.0.1:8000/auth/admin/set-role", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim(), role }),
      });

      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        toast({ title: "Роль обновлена", description: `${data.username}: ${data.role}`, status: "success" });
      } else {
        toast({ title: data.detail || "Ошибка", status: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="520px" mx="auto" bg="white" p={8} borderRadius="2xl" borderWidth="1px" boxShadow="lg">
      <Heading size="lg" mb={2}>Admin</Heading>
      <Text color="gray.500" mb={6}>Управление ролями пользователей</Text>

      <VStack spacing={4} align="stretch">
        <Input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </Select>
        <Button colorScheme="blue" onClick={submit} isLoading={loading}>
          Сохранить
        </Button>
      </VStack>
    </Box>
  );
};

export default Admin;