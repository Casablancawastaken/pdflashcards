import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Input,
  VStack,
  Heading,
  Text,
  Divider,
  useToast,
  Spinner,
  Center,
  SimpleGrid,
} from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

interface UserProfile {
  username: string;
  email: string;
  created_at?: string;
}

const Settings = () => {
  const { token } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const toast = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;
      try {
        const r = await fetch("http://127.0.0.1:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          setProfile(await r.json());
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, [token]);

  const changePassword = async () => {
    if (newPassword !== repeatPassword) {
      toast({ title: "Пароли не совпадают", status: "error" });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("http://127.0.0.1:8000/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      if (r.ok) {
        toast({ title: "Пароль изменён", status: "success" });
        setOldPassword("");
        setNewPassword("");
        setRepeatPassword("");
      } else {
        const data = await r.json();
        toast({ title: data.detail || "Ошибка", status: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <Center h="60vh">
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  return (
    <Center py={12}>
      <Box
        w="100%"
        maxW="600px"
        bg="white"
        borderRadius="2xl"
        boxShadow="lg"
        borderWidth="1px"
        p={10}
      >

        <Heading size="lg" textAlign="center" mb={2}>
          Настройки аккаунта
        </Heading>
        <Text textAlign="center" color="gray.500" mb={8}>
          Управление профилем и безопасностью
        </Text>


        {profile && (
          <>
            <Heading size="sm" mb={4}>
              Информация о пользователе
            </Heading>

            <SimpleGrid columns={2} spacing={4} mb={6}>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Имя пользователя
                </Text>
                <Text fontWeight="medium">{profile.username}</Text>
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.500">
                  Email
                </Text>
                <Text fontWeight="medium">{profile.email}</Text>
              </Box>
            </SimpleGrid>

            <Divider my={6} />
          </>
        )}

 
        <Heading size="sm" mb={4}>
          Смена пароля
        </Heading>

        <VStack spacing={4}>
          <Input
            placeholder="Текущий пароль"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <Input
            placeholder="Новый пароль"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            placeholder="Повторите новый пароль"
            type="password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
          />

          <Button
            mt={4}
            size="lg"
            w="100%"
            colorScheme="blue"
            onClick={changePassword}
            isLoading={loading}
          >
            Обновить пароль
          </Button>
        </VStack>
      </Box>
    </Center>
  );
};

export default Settings;
