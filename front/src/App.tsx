import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { Container, Center, Spinner } from "@chakra-ui/react";

import Header from "./components/Header";
import PdfUpload from "./components/PdfUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const UploadDetail = lazy(() => import("./pages/UploadDetail"));
const Settings = lazy(() => import("./pages/Settings"));
const CardsPage = lazy(() => import("./pages/CardsPage"));
const Admin = lazy(() => import("./pages/Admin"));

function App() {
  return (
    <>
      <Header />

      <Container maxW="container.lg" py={6}>
        <Suspense
          fallback={
            <Center minH="40vh">
              <Spinner size="lg" color="blue.500" />
            </Center>
          }
        >
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
            <Route
              path="/uploads/:id"
              element={
                <ProtectedRoute>
                  <UploadDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cards/:id"
              element={
                <ProtectedRoute>
                  <CardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Container>
    </>
  );
}

export default App;