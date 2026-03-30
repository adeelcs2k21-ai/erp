"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

export default function Documentation() {
  const [currentPage, setCurrentPage] = useState(5);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?userId=superadmin");
      const data = await res.json();
      setNotifications(data.filter((n: any) => !n.read));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <ProtectedRoute>
      <Box
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "row",
          fontFamily: "Poppins, sans-serif",
          padding: "40px",
        }}
      >
        <Navigation currentPage={currentPage} />

        {/* Main Content - Right Side */}
        <Box
          style={{
            marginLeft: "200px",
            flex: 1,
            paddingBottom: "100px",
          }}
        >
          {/* Rectangle Stroke Container */}
          <Box
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "30px",
              marginTop: "40px",
              marginLeft: "80px",
              marginRight: "-400px",
              width: "1300px",
              minHeight: "600px",
              position: "relative",
            }}
          >
            {/* Notification Icon - Top Right */}
            <Box
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <Box style={{ position: "relative" }}>
                <Button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#999",
                    border: "none",
                    fontFamily: "Poppins, sans-serif",
                    padding: "6px 10px",
                    fontSize: "14px",
                    fontWeight: "300",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {notifications.length > 0 && notifications.length}
                </Button>
                {showNotifications && (
                  <>
                    <Box
                      onClick={() => setShowNotifications(false)}
                      style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 999,
                      }}
                    />
                    <Box
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        right: 0,
                        backgroundColor: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        minWidth: "300px",
                        maxHeight: "400px",
                        overflowY: "auto",
                        zIndex: 1001,
                        marginBottom: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {notifications.length === 0 ? (
                        <Text style={{ padding: "20px", color: "#999", fontSize: "12px" }}>
                          No notifications
                        </Text>
                      ) : (
                        notifications.map((notif) => (
                          <Box
                            key={notif.id}
                            style={{
                              padding: "12px",
                              borderBottom: "1px solid #eee",
                              cursor: "pointer",
                              backgroundColor: "#f9f9f9",
                            }}
                          >
                            <Text style={{ fontWeight: "600", fontSize: "11px" }}>
                              {notif.title}
                            </Text>
                            <Text style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                              {notif.message}
                            </Text>
                          </Box>
                        ))
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {/* Content */}
            <Box style={{ paddingTop: "20px" }}>
              <Text style={{ fontSize: "24px", fontWeight: "600", marginBottom: "20px", fontFamily: "Poppins, sans-serif" }}>
                Documentation
              </Text>
              <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                Documentation module content coming soon.
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
      <LogoutButton />
    </ProtectedRoute>
  );
}
