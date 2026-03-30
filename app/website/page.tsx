"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
}

export default function Website() {
  const [currentPage] = useState(6);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=superadmin`);
      const data = await res.json();
      const unread = data.filter((n: any) => !n.read);
      setNotifications(unread);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchNotifications();
  };

  const clearAllNotifications = async () => {
    for (const notif of notifications) {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif.id }),
      });
    }
    fetchNotifications();
  };

  const handleNotificationClick = (notif: Notification) => {
    // Website page - navigate based on notification type
    if (notif.type === "po_pending_approval") {
      window.location.href = "/dashboard";
    } else if (notif.type === "po_approved" || notif.type === "po_rejected") {
      window.location.href = "/purchase";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
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
                    fontSize: "16px",
                    fontWeight: "300",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {!showNotifications && unreadCount > 0 && unreadCount}
                </Button>
                {showNotifications && (
                  <>
                    {/* Overlay to close on click outside */}
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
                        top: "100%",
                        right: 0,
                        backgroundColor: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        minWidth: "300px",
                        maxHeight: "400px",
                        overflowY: "auto",
                        zIndex: 1001,
                        marginTop: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      {notifications.length === 0 ? (
                        <Text style={{ padding: "20px", color: "#999", fontSize: "12px" }}>
                          No notifications
                        </Text>
                      ) : (
                        <>
                          {notifications.map((notif) => (
                            <Box
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              style={{
                                padding: "12px",
                                borderBottom: "1px solid #eee",
                                cursor: "pointer",
                                backgroundColor: "#f9f9f9",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                gap: "8px",
                                transition: "background-color 0.2s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                            >
                              <Box style={{ flex: 1 }}>
                                <Text style={{ fontWeight: "600", fontSize: "11px" }}>
                                  {notif.title}
                                </Text>
                                <Text style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                                  {notif.message}
                                </Text>
                              </Box>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                size="xs"
                                style={{
                                  backgroundColor: "transparent",
                                  color: "#999",
                                  border: "none",
                                  padding: "4px 8px",
                                  fontSize: "14px",
                                  cursor: "pointer",
                                  minWidth: "auto",
                                }}
                                title="Delete notification"
                              >
                                ×
                              </Button>
                            </Box>
                          ))}
                          <Box
                            style={{
                              padding: "12px",
                              borderTop: "1px solid #eee",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              onClick={clearAllNotifications}
                              size="xs"
                              style={{
                                backgroundColor: "transparent",
                                color: "#999",
                                border: "1px solid #e0e0e0",
                                fontFamily: "Poppins, sans-serif",
                                fontSize: "11px",
                                padding: "6px 12px",
                              }}
                            >
                              Clear All
                            </Button>
                          </Box>
                        </>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {/* Content */}
            <Box style={{ paddingTop: "20px" }}>
              <Text
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#000",
                  fontFamily: "Poppins, sans-serif",
                  marginBottom: "20px",
                }}
              >
                Website Management
              </Text>
              <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                Website management features coming soon.
              </Text>
            </Box>
          </Box>
        </Box>

        {/* Logout Button - Outside Container */}
        <Box
          style={{
            position: "fixed",
            left: "120px",
            bottom: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
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
      </Box>
      <LogoutButton />
    </ProtectedRoute>
  );
}
