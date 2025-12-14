import { Routes, Route } from "react-router-dom";
import { Container } from "@chakra-ui/react";

import Header from "./components/Header";
import PdfUpload from "./components/PdfUpload";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import UploadDetail from "./pages/UploadDetail";
import UploadCards from "./pages/UploadCards";
import Settings from "./pages/Settings";
import CardsPage from "./pages/CardsPage";

function App() {
  return (
    <>
      <Header />

      <Container maxW="container.lg" py={6}>
        <Routes>
          <Route path="/" element={<PdfUpload />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/uploads/:id" element={<UploadDetail />} />
          <Route path="/uploads/:id/cards" element={<UploadCards />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/cards/:id" element={<CardsPage />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;
