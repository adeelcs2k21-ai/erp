"use client";

import { Box, Button } from "@mantine/core";
import { useEffect, useState } from "react";

const pages = ["Dashboard", "Finance", "BOM", "Inventory", "Manufacturing", "Documentation", "Website", "CRM", "HR"];

const routes: { [key: string]: string } = {
  Dashboard: "/dashboard",
  CRM: "/crm",
  BOM: "/bom",
  Purchase: "/bom", // Keep for backward compatibility
  Manufacturing: "/manufacturing",
  HR: "/hr",
  Finance: "/finance",
  Inventory: "/inventory",
  Documentation: "/documentation",
  Website: "/website",
};

interface NavigationProps {
  currentPage: number;
}

export function Navigation({ currentPage }: NavigationProps) {
  const [visiblePages, setVisiblePages] = useState<string[]>([]);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) return;

    const user = JSON.parse(userStr);

    // Superadmin and admin see all pages
    if (user.role === "superadmin" || user.role === "admin") {
      setVisiblePages(pages);
    } else {
      // Editors see their assigned modules
      let userModules = Array.isArray(user.modules) ? user.modules : [user.module];
      // Convert old "Purchase" to new "BOM" for backward compatibility
      userModules = userModules.map((m: string) => m === "Purchase" ? "BOM" : m);
      setVisiblePages(userModules);
    }
  }, []);

  return (
    <Box
      style={{
        position: "fixed",
        left: "120px",
        top: "80px",
        gap: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      {visiblePages.map((page) => (
        <Button
          key={page}
          onClick={() => {
            window.location.href = routes[page];
          }}
          variant="subtle"
          style={{
            backgroundColor: "transparent",
            color: currentPage === pages.indexOf(page) ? "#000" : "#999",
            fontSize: "16px",
            fontWeight: currentPage === pages.indexOf(page) ? "600" : "400",
            padding: "0px 0",
            textDecoration: "none",
            transition: "all 0.2s ease",
            border: "none",
            cursor: "pointer",
            lineHeight: "1",
            height: "auto",
            minHeight: "auto",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              currentPage === pages.indexOf(page) ? "#000" : "#999";
          }}
        >
          {page}
        </Button>
      ))}
    </Box>
  );
}
