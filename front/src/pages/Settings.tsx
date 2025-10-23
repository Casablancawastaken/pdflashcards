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
  HStack,
  Icon,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { AtSignIcon, LockIcon, TimeIcon } from "@chakra-ui/icons";
import { FaUser } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

interface UserProfile {
  username: string;
  email: string;
  created_at?: string;
}

const Settings = () => {
  const { token } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const toast = useToast();

  // Загружаем профиль пользователя
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const r = await fetch("http://127.0.0.1:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          setUserProfile(data);
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [token]);

  // Смена пароля
  const handleChangePassword = async () => {
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
        toast({ title: "Пароль успешно изменён", status: "success" });
        setOldPassword("");
        setNewPassword("");
        setRepeatPassword("");
      } else {
        const data = await r.json();
        toast({ title: data.detail || "Ошибка смены пароля", status: "error" });
      }
    } catch {
      toast({ title: "Ошибка сети", status: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Пока профиль загружается
  if (loadingProfile) {
    return (
      <Center h="60vh">
        <Spinner size="lg" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth="1px" borderRadius="lg" boxShadow="sm">
      <Heading size="lg" mb={6} textAlign="center">
        Настройки профиля
      </Heading>

      {/* --- Информация о пользователе --- */}
      {userProfile ? (
        <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50" mb={6}>
          <VStack align="stretch" spacing={3}>
            <HStack>
              <Icon as={FaUser} color="blue.500" />
              <Text><b>Имя пользователя:</b> {userProfile.username}</Text>
            </HStack>
            <HStack>
              <Icon as={AtSignIcon} color="green.500" />
              <Text><b>Email:</b> {userProfile.email}</Text>
            </HStack>
            <HStack>
              <Icon as={LockIcon} color="orange.500" />
              <Text>
                <b>Пароль:</b> {"•".repeat(10)}
              </Text>
            </HStack>
            {userProfile.created_at && (
              <HStack>
                <Icon as={TimeIcon} color="purple.500" />
                <Text>
                  <b>Дата регистрации:</b>{" "}
                  {new Date(userProfile.created_at).toLocaleString()}
                </Text>
              </HStack>
            )}
          </VStack>
        </Box>
      ) : (
        <Text>Ошибка загрузки профиля.</Text>
      )}

      <Divider my={6} />

      {/* --- Смена пароля --- */}
      <VStack spacing={4} align="stretch">
        <Heading size="md">Сменить пароль</Heading>
        <Input
          placeholder="Старый пароль"
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
          colorScheme="blue"
          onClick={handleChangePassword}
          isLoading={loading}
        >
          Сменить пароль
        </Button>
      </VStack>
    </Box>
  );
};

export default Settings;
