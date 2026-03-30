"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, Button, Text, Tabs, Badge, Table, Loader } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

export default function ClientDetails() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [currentPage] = useState(7);
  const [activeTab, setActiveTab] = useState<string | null>("info");
  const [client, setClient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientDetails();
    fetchClientOrders();
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const res = await fetch("/api/crm/clients");
      const data = await res.json();
      const foundClient = data.find((c: any) => c.id === clientId);
      setClient(foundClient);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const fetchClientOrders = async () => {
    try {
      const res = await fetch(`/api/crm/orders?clientId=${clientId}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <Loader />
        </Box>
      </ProtectedRoute>
    );
  }

  if (!client) {
    return (
      <ProtectedRoute>
        <Box style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", flexDirection: "column", gap: "16px" }}>
          <Text>Client not found</Text>
          <Button onClick={() => router.push("/crm")}>Back to CRM</Button>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Box style={{ width: "100%", minHeight: "100vh", backgroundColor: "white", display: "flex", flexDirection: "row", fontFamily: "Poppins, sans-serif", padding: "40px" }}>
        <Navigation currentPage={currentPage} />
        <Box style={{ marginLeft: "200px", flex: 1, paddingBottom: "100px" }}>
          <Box style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "30px", marginTop: "40px", marginLeft: "80px", marginRight: "-400px", width: "1300px", minHeight: "600px", position: "relative" }}>
            <Box style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <Button 
                onClick={() => router.push("/crm")} 
                style={{ backgroundColor: "transparent", color: "#666", border: "1px solid #e0e0e0", padding: "8px 12px" }}
              >
                ← Back
              </Button>
              <Text style={{ fontSize: "18px", fontWeight: "600" }}>
                {client.name}
              </Text>
            </Box>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="info">Client Information</Tabs.Tab>
                <Tabs.Tab value="orders">Orders ({orders.length})</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="info" pt="md">
                <Box style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
                  <Box style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <Text style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Name</Text>
                    <Text style={{ fontSize: "16px", fontWeight: "600" }}>{client.name}</Text>
                  </Box>

                  <Box style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <Text style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Company</Text>
                    <Text style={{ fontSize: "16px", fontWeight: "600" }}>{client.company || "—"}</Text>
                  </Box>

                  <Box style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <Text style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Email</Text>
                    <Text style={{ fontSize: "16px", fontWeight: "600" }}>{client.email}</Text>
                  </Box>

                  <Box style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <Text style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Phone</Text>
                    <Text style={{ fontSize: "16px", fontWeight: "600" }}>{client.phone}</Text>
                  </Box>

                  <Box style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                    <Text style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Address</Text>
                    <Text style={{ fontSize: "16px", fontWeight: "600" }}>{client.address || "—"}</Text>
                  </Box>

                  {client.created_at && (
                    <Box style={{ padding: "16px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
                      <Text style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", marginBottom: "4px" }}>Client Since</Text>
                      <Text style={{ fontSize: "16px", fontWeight: "600" }}>
                        {new Date(client.created_at).toLocaleDateString()}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="orders" pt="md">
                {orders.length === 0 ? (
                  <Box style={{ textAlign: "center", padding: "60px 20px" }}>
                    <Text style={{ color: "#999", fontSize: "14px", marginBottom: "8px" }}>No orders yet</Text>
                    <Text style={{ color: "#ccc", fontSize: "12px" }}>This client hasn't placed any orders</Text>
                  </Box>
                ) : (
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Order #</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Date</Table.Th>
                        <Table.Th>Items</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {orders.map((order) => (
                        <Table.Tr key={order.id}>
                          <Table.Td style={{ fontWeight: "600" }}>
                            {order.order_number || order.orderNumber}
                          </Table.Td>
                          <Table.Td>
                            <Badge 
                              color={
                                order.status === "completed" ? "green" : 
                                order.status === "pending" ? "yellow" : 
                                order.status === "processing" ? "blue" : "gray"
                              }
                            >
                              {order.status}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            PKR {(order.total_price || order.totalAmount || 0).toLocaleString()}
                          </Table.Td>
                          <Table.Td>
                            {new Date(order.created_at || order.createdAt).toLocaleDateString()}
                          </Table.Td>
                          <Table.Td>
                            {order.items?.length || order.products?.length || "—"}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </Tabs.Panel>
            </Tabs>
          </Box>
        </Box>
        <Box style={{ position: "fixed", left: "120px", bottom: "40px" }}>
          <Button onClick={handleLogout} style={{ backgroundColor: "transparent", color: "#999", border: "none", padding: "8px 12px", fontSize: "16px" }} title="Logout">
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
