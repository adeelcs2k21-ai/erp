"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Table, Input, Group } from "@mantine/core";
import { Navigation } from "@/components/Navigation";

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "completed";
  createdAt: string;
}

export default function Orders() {
  const [currentPage, setCurrentPage] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data);
  };

  const addOrder = async () => {
    if (!customerName || !customerEmail) return;
    await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName, customerEmail }),
    });
    setCustomerName("");
    setCustomerEmail("");
    fetchOrders();
  };

  const completeOrder = async (id: string) => {
    await fetch("/api/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });
    fetchOrders();
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
          display: "flex",
          flexDirection: "row",
          width: "100%",
          height: "100%",
        }}
      >
        <Navigation currentPage={currentPage} />

        {/* Center Content */}
        <Box
          style={{
            position: "fixed",
            left: "350px",
            top: "80px",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <Text
            style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "#000",
              margin: "0 0 30px 0",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Orders
          </Text>

          {/* Add Order Form */}
          <Box style={{ marginBottom: "30px", paddingBottom: "20px", borderBottom: "1px solid #eee" }}>
            <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "10px" }}>
              New Order
            </Text>
            <Group>
              <Input
                placeholder="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.currentTarget.value)}
                style={{ fontFamily: "Poppins, sans-serif" }}
              />
              <Input
                placeholder="Customer Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.currentTarget.value)}
                style={{ fontFamily: "Poppins, sans-serif" }}
              />
              <Button
                onClick={addOrder}
                style={{
                  backgroundColor: "#000",
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                Add Order
              </Button>
            </Group>
          </Box>

          {/* Orders Table */}
          {orders.length === 0 ? (
            <Text style={{ color: "#999", fontSize: "14px" }}>
              No orders yet.
            </Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Customer Name</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Action</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {orders.map((order) => (
                  <Table.Tr key={order.id}>
                    <Table.Td>{order.customerName}</Table.Td>
                    <Table.Td>{order.customerEmail}</Table.Td>
                    <Table.Td>
                      <Text
                        style={{
                          color: order.status === "completed" ? "#000" : "#999",
                          fontSize: "14px",
                        }}
                      >
                        {order.status}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {order.status === "pending" && (
                        <Button
                          onClick={() => completeOrder(order.id)}
                          size="xs"
                          style={{
                            backgroundColor: "#000",
                            color: "#fff",
                            fontFamily: "Poppins, sans-serif",
                          }}
                        >
                          Complete
                        </Button>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Box>
      </Box>
    </Box>
  );
}
