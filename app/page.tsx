"use client";

import { useEffect, useState } from "react";
import { Box, Text } from "@mantine/core";

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      window.location.href = "/dashboard";
    } else {
      window.location.href = "/login";
    }
  }, []);

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
      <Text
        style={{
          fontSize: "18px",
          color: "#666",
        }}
      >
        Loading ERP System...
      </Text>
    </Box>
  );
}
