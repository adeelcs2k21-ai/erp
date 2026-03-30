"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Text } from "@mantine/core";

interface User {
  id: string;
  username: string;
  role: string;
  module: string;
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }

    const userData = JSON.parse(userStr);
    
    if (requiredRole && userData.role !== requiredRole && userData.role !== "superadmin") {
      setLoading(false);
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router, requiredRole]);

  if (loading) {
    return (
      <Box
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>Loading...</Text>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        style={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>Access Denied</Text>
      </Box>
    );
  }

  return <>{children}</>;
}
