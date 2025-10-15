import { BrowserRouter, Routes, Route, Link } from "react-router-dom"
import { Container, HStack, Button } from "@chakra-ui/react"
import Register from "./pages/Register"
import Login from "./pages/Login"
import PdfUpload from "./components/PdfUpload"

function App() {
  return (
    <BrowserRouter>
      <Container maxW="container.md" py={6}>
        <HStack spacing={4} mb={6}>
          <Button as={Link} to="/" colorScheme="blue" variant="outline">
            Загрузка PDF
          </Button>
          <Button as={Link} to="/register" colorScheme="green" variant="outline">
            Регистрация
          </Button>
          <Button as={Link} to="/login" colorScheme="teal" variant="outline">
            Вход
          </Button>
        </HStack>

        <Routes>
          <Route path="/" element={<PdfUpload />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Container>
    </BrowserRouter>
  )
}

export default App
