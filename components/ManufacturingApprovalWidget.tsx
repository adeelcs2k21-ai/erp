"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Table, Badge, Modal, Textarea } from "@mantine/core";

interface ManufacturingProduction {
  id: string;
  production_number: string;
  product_name: string;
  quantity: number;
  unit: string;
  status: string;
  approval_status: string;
  created_by: string;
  created_at: string;
}

export function ManufacturingApprovalWidget() {
  const [orders, setOrders] = useState<ManufacturingProduction[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ManufacturingProduction | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch("/api/manufacturing/orders");
      const data = await res.json();
      const pending = data.filter((o: ManufacturingProduction) => o.approval_status === "pending");
      setOrders(pending);
    } catch (error) {
      console.error("Error fetching productions:", error);
    }
  };

  const approveOrder = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch("/api/manufacturing/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          approval_status: "approved",
          status: "approved",
          approved_by: currentUser?.username,
          approved_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setOrders(Array.isArray(orders) ? orders.filter((o) => o.id !== selectedOrder.id) : []);
        setShowApprovalModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error approving order:", error);
    }
  };

  const rejectOrder = async () => {
    if (!selectedOrder) return;

    try {
      const res = await fetch("/api/manufacturing/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedOrder.id,
          approval_status: "rejected",
          status: "cancelled",
          rejection_reason: rejectionReason,
          approved_by: currentUser?.username,
          approved_at: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setOrders(Array.isArray(orders) ? orders.filter((o) => o.id !== selectedOrder.id) : []);
        setShowApprovalModal(false);
        setSelectedOrder(null);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
    }
  };

  return (
    <Box style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f9f9f9", borderRadius: "4px" }}>
      <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>
        Production Requests Pending Approval ({orders.length})
      </Text>

      {orders.length === 0 ? (
        <Text style={{ color: "#999", fontSize: "14px" }}>No pending manufacturing orders</Text>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Production #</Table.Th>
              <Table.Th>Product</Table.Th>
              <Table.Th>Quantity</Table.Th>
              <Table.Th>Created By</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.isArray(orders) && orders.map((order, idx) => (
              <Table.Tr key={order.id || idx}>
                <Table.Td>{order.production_number}</Table.Td>
                <Table.Td>{order.product_name}</Table.Td>
                <Table.Td>{order.quantity} {order.unit}</Table.Td>
                <Table.Td>{order.created_by}</Table.Td>
                <Table.Td>
                  <Button
                    size="xs"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowApprovalModal(true);
                    }}
                  >
                    Review
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {/* Approval Modal */}
      <Modal
        opened={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedOrder(null);
          setRejectionReason("");
        }}
        title="Production Request Approval"
        size="md"
      >
        {selectedOrder && (
          <Box style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <Box>
              <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "5px" }}>Production Details</Text>
              <Box style={{ backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "4px" }}>
                <Text style={{ fontSize: "12px" }}>Production #: {selectedOrder.production_number}</Text>
                <Text style={{ fontSize: "12px" }}>Product: {selectedOrder.product_name}</Text>
                <Text style={{ fontSize: "12px" }}>Quantity: {selectedOrder.quantity} {selectedOrder.unit}</Text>
                <Text style={{ fontSize: "12px" }}>Created By: {selectedOrder.created_by}</Text>
              </Box>
            </Box>

            <Textarea
              label="Rejection Reason (if rejecting)"
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.currentTarget.value)}
            />

            <Box style={{ display: "flex", gap: "10px" }}>
              <Button
                onClick={approveOrder}
                style={{ backgroundColor: "#28a745", color: "#fff", flex: 1 }}
              >
                Approve
              </Button>
              <Button
                onClick={rejectOrder}
                style={{ backgroundColor: "#dc3545", color: "#fff", flex: 1 }}
              >
                Reject
              </Button>
            </Box>
          </Box>
        )}
      </Modal>
    </Box>
  );
}
