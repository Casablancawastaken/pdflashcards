import { Routes, Route, Link } from "react-router-dom";
import { Container, HStack, Button, Text, Spacer } from "@chakra-ui/react";
import PdfUpload from "./components/PdfUpload";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logout } = useAuth();

  return (
    <Container maxW="container.md" py={6}>
      <HStack spacing={4} mb={6}>
        <Button as={Link} to="/" colorScheme="blue" variant="outline">
          Главная
        </Button>
        <Spacer />
        {user ? (
          <>
            <Text>Привет, {user.username}!</Text>
            <Button colorScheme="red" onClick={logout}>
              Выйти
            </Button>
          </>
        ) : (
          <>
            <Button as={Link} to="/register" colorScheme="green" variant="outline">
              Регистрация
            </Button>
            <Button as={Link} to="/login" colorScheme="teal" variant="outline">
              Войти
            </Button>
          </>
        )}
      </HStack>

      <Routes>
        <Route path="/" element={<PdfUpload />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Container>
  );
}

export default App;
