import { Routes, Route, Link } from "react-router-dom";
import { Container, HStack, Button, Text, Spacer } from "@chakra-ui/react";
import PdfUpload from "./components/PdfUpload";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import UploadDetail from "./pages/UploadDetail";
import UploadCards from "./pages/UploadCards";
import Settings from "./pages/Settings";
import CardsPage from "./pages/CardsPage";

function App() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <Container py={10}>
        <Text>Загрузка...</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={6}>
      <HStack spacing={4} mb={6}>
        <Button as={Link} to="/" colorScheme="blue" variant="outline">
          Главная
        </Button>

        {user && (
          <Button as={Link} to="/profile" colorScheme="purple" variant="outline">
            Профиль
          </Button>
        )}

        <Spacer />
        {user ? (
          <>
            <Button as={Link} to="/settings" colorScheme="gray" variant="outline">
              Настройки
            </Button>
            <Text>{user.username}</Text>
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
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>
        <Route path="/uploads/:id" element={<UploadDetail />} />
        <Route path="/uploads/:id/cards" element={<UploadCards />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/cards/:id" element={<CardsPage />} />
      </Routes>
    </Container>
  );
}

export default App;
