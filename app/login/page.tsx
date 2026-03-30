"use client";

import { useState } from "react";
import { Box, Button, Input, Text } from "@mantine/core";
import { useRouter } from "next/navigation";
import { moduleRoutes } from "@/lib/modules";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Please enter username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      if (!res.ok) {
        setError("Invalid credentials");
        setLoading(false);
        return;
      }

      const user = await res.json();
      localStorage.setItem("user", JSON.stringify(user));
      
      // Redirect to first module page
      const firstModule = user.modules?.[0] || user.module || "Dashboard";
      const redirectUrl = moduleRoutes[firstModule] || "/dashboard";
      router.push(redirectUrl);
    } catch (err) {
      setError("Login failed");
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Box
        style={{
          width: "300px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <Text
          style={{
            fontSize: "28px",
            fontWeight: "600",
            color: "#000",
            textAlign: "center",
          }}
        >
          ERP Login
        </Text>

        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
          style={{ fontFamily: "Poppins, sans-serif" }}
        />

        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={{ fontFamily: "Poppins, sans-serif" }}
        />

        {error && (
          <Text style={{ color: "red", fontSize: "12px" }}>{error}</Text>
        )}

        <Button
          onClick={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: "#000",
            color: "#fff",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>

        <Box style={{ fontSize: "11px", color: "#999" }}>
          <Text style={{ marginBottom: "8px", fontWeight: "600" }}>Default Credentials:</Text>
          <Text>superadmin / superadmin123</Text>
          <Text>admin / admin123</Text>
          <Text>dashboard_editor / dashboard123</Text>
          <Text>finance_editor / finance123</Text>
          <Text>purchase_editor / purchase123</Text>
          <Text>inventory_editor / inventory123</Text>
          <Text>manufacturing_editor / manufacturing123</Text>
          <Text>documentation_editor / documentation123</Text>
          <Text>website_editor / website123</Text>
          <Text>crm_editor / crm123</Text>
          <Text>hr_editor / hr123</Text>
        </Box>
      </Box>
    </Box>
  );
}
