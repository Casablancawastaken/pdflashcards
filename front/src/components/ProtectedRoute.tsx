import React, { useEffect } from "react";
import type { ReactNode } from "react"; 
import { useNavigate } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Box p={8} textAlign="center">
        <Text>Загрузка...</Text>
      </Box>
    );
  }

  if (!user) return null;

  if (roles && !roles.includes(user.role)) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500">403: Недостаточно прав</Text>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;