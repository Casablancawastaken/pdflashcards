import { Link } from "react-router-dom";
import { Box, Flex, Button, Text, Spacer, HStack, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FiLogOut, FiSettings, FiUser, FiCpu, FiClock } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <Box bg="blue.600" color="white" px={8} py={4} borderBottomRadius="xl" position="relative" zIndex={10}>
      <Flex align="center">
        <Text fontSize="2xl" fontWeight="bold">
          pdflashcards
        </Text>

        <HStack spacing={2} ml={12}>
          <Button as={Link} to="/" size="md" variant="ghost" color="white" leftIcon={<FiCpu />} _hover={{ bg: "blue.700" }}>
            Генерация
          </Button>

          {user && (
            <Button as={Link} to="/profile" size="md" variant="ghost" color="white" leftIcon={<FiClock />} _hover={{ bg: "blue.700" }}>
              История
            </Button>
          )}
        </HStack>

        <Spacer />

        {user ? (
          <Menu>
            <MenuButton as={Button} size="md" variant="ghost" color="white" leftIcon={<FiUser />} rightIcon={<ChevronDownIcon />} _hover={{ bg: "blue.700" }} _active={{ bg: "blue.700" }}>
              {user.username}
            </MenuButton>

            <MenuList mt={3} bg="blue.600" color="white" border="none" borderRadius="lg" boxShadow="xl" minW="200px" py={2}>
              <MenuItem as={Link} to="/settings" icon={<FiSettings />} bg="blue.600" _hover={{ bg: "blue.700" }}>
                Настройки
              </MenuItem>

              <MenuItem icon={<FiLogOut />} bg="blue.600" _hover={{ bg: "red.500" }} onClick={logout}>
                Выйти
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <HStack spacing={3}>
            <Button as={Link} to="/login" size="md">
              Войти
            </Button>
            <Button as={Link} to="/register" size="md" variant="outline" color="white" _hover={{ bg: "blue.700" }}>
              Регистрация
            </Button>
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default Header;