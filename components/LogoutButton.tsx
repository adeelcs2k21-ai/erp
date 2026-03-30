"use client";

import { Box, Button } from "@mantine/core";

export function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <Box
      style={{
        position: "fixed",
        left: "120px",
        bottom: "40px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 100,
      }}
    >
      <Button
        onClick={handleLogout}
        style={{
          backgroundColor: "transparent",
          color: "#999",
          border: "none",
          fontFamily: "Poppins, sans-serif",
          padding: "8px 12px",
          fontSize: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        title="Logout"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </Button>
    </Box>
  );
}
