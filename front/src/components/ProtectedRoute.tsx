import React, { useEffect } from "react";
import type { ReactNode } from "react"; 
import { useNavigate } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Text>Загрузка...</Text>
      </Box>
    );
  }

  return <>{user ? children : null}</>;
};

export default ProtectedRoute;
