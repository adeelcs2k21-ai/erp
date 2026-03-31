"use client";

import { useState, useEffect } from "react";
import { Box, Text, Button, Table, Badge, Group, Modal, Textarea, Tabs, Input, Select, NumberInput } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface User {
  id: string;
  username: string;
  role: string;
  module: string;
}

interface PurchaseOrderItem {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  items: PurchaseOrderItem[];
  deliveryDate: string;
  paymentTerms: string;
  notes: string;
  totalAmount: number;
  status: string;
  createdBy: string;
  approvedBy?: string;
  rejectionRemarks?: string;
  suppliers?: Supplier[];
}

interface DashboardUser {
  id: string;
  username: string;
  email: string;
  role: string;
  modules: string[];
}

function ClientOrdersPanel() {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string | null>("pending");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  const fetchData = async () => {
    const [or, cl] = await Promise.all([fetch("/api/crm/orders"), fetch("/api/crm/clients")]);
    if (or.ok) setOrders(await or.json());
    if (cl.ok) setClients(await cl.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const approve = async (id: string) => {
    await fetch("/api/crm/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "approved" }) });
    fetchData(); setSelected((p: any) => p ? { ...p, status: "approved" } : null);
  };

  const reject = async (id: string) => {
    await fetch("/api/crm/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "cancelled" }) });
    fetchData(); setSelected((p: any) => p ? { ...p, status: "cancelled" } : null);
  };

  const deleteOrder = async () => {
    if (!orderToDelete) return;
    
    setDeletingOrder(true);
    
    try {
      // If order is fulfilled, restore inventory stock
      if (orderToDelete.status === "fulfilled") {
        // Find the product by name and restore stock
        const productsRes = await fetch("/api/products");
        const products = await productsRes.json();
        const product = products.find((p: any) => p.name.toLowerCase() === orderToDelete.product_name.toLowerCase());
        
        if (product) {
          const newStock = product.stock + orderToDelete.quantity;
          
          // Update product stock
          await fetch("/api/products", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: product.id,
              stock: newStock
            })
          });
          
          // Add to product history
          await fetch("/api/products/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product_id: product.id,
              product_name: product.name,
              action: "order_deleted",
              quantity_change: orderToDelete.quantity,
              stock_before: product.stock,
              stock_after: newStock,
              note: `Order deleted - Stock restored for ${orderToDelete.client_name} - Order #${orderToDelete.id.slice(0, 8)}`,
              created_by: "admin",
              snapshot_image: product.images?.[0] || null,
              snapshot_price: product.price || 0,
              snapshot_unit: product.unit || "pieces"
            })
          });
        }
      }
      
      // Delete the order
      await fetch("/api/crm/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderToDelete.id })
      });
      
      setShowDeleteModal(false);
      setOrderToDelete(null);
      setDeletingOrder(false);
      setShowDeleteSuccessModal(true);
      fetchData();
    } catch (error) {
      console.error("Error deleting order:", error);
      setDeletingOrder(false);
      alert("Error deleting order. Please try again.");
    }
  };

  if (loading) return <Text style={{ color: "#999", fontFamily: "Poppins, sans-serif" }}>Loading...</Text>;
  if (orders.length === 0) return <Text style={{ color: "#999", fontFamily: "Poppins, sans-serif" }}>No client orders yet.</Text>;

  const pending = orders.filter(o => o.status === "pending");
  const rest = orders.filter(o => o.status !== "pending");
  const selectedClient = selected ? clients.find((c: any) => c.id === selected.client_id) : null;

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="pending" style={{ fontSize: "13px" }}>
            Pending Approval ({pending.length})
          </Tabs.Tab>
          <Tabs.Tab value="all" style={{ fontSize: "13px" }}>
            All Orders ({rest.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pending" pt="md">
          {pending.length === 0 ? (
            <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              No pending orders.
            </Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pending.map((o: any) => (
                  <Table.Tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                    <Table.Td style={{ fontWeight: "600", color: "#007bff" }}>{o.client_name}</Table.Td>
                    <Table.Td>{o.product_name}</Table.Td>
                    <Table.Td>{o.quantity} {o.unit}</Table.Td>
                    <Table.Td style={{ fontSize: "12px", color: "#888" }}>{new Date(o.created_at).toLocaleDateString()}</Table.Td>
                    <Table.Td onClick={(e: any) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <Button size="xs" onClick={() => approve(o.id)} style={{ backgroundColor: "#28a745", color: "white" }}>Approve</Button>
                        <Button size="xs" onClick={() => reject(o.id)} style={{ backgroundColor: "#dc3545", color: "white" }}>Reject</Button>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="all" pt="md">
          {rest.length === 0 ? (
            <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              No orders yet.
            </Text>
          ) : (
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client</Table.Th>
                  <Table.Th>Product</Table.Th>
                  <Table.Th>Order Amount</Table.Th>
                  <Table.Th>Payment Amount</Table.Th>
                  <Table.Th>Payment Method</Table.Th>
                  <Table.Th>Date Received</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rest.map((o: any) => (
                  <Table.Tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                    <Table.Td style={{ fontWeight: "600", color: "#007bff" }}>{o.client_name}</Table.Td>
                    <Table.Td>{o.product_name}</Table.Td>
                    <Table.Td>PKR {(o.total_price || 0).toLocaleString()}</Table.Td>
                    <Table.Td>PKR {(o.payment_amount || 0).toLocaleString()}</Table.Td>
                    <Table.Td>{o.payment_method || "-"}</Table.Td>
                    <Table.Td style={{ fontSize: "12px", color: "#888" }}>
                      {o.payment_confirmed_at ? new Date(o.payment_confirmed_at).toLocaleDateString() : "-"}
                    </Table.Td>
                    <Table.Td><Badge color={o.status === "approved" ? "green" : o.status === "fulfilled" ? "blue" : "red"}>{o.status}</Badge></Table.Td>
                    <Table.Td onClick={(e: any) => e.stopPropagation()}>
                      <Button 
                        size="xs" 
                        onClick={() => {
                          setOrderToDelete(o);
                          setShowDeleteModal(true);
                        }}
                        style={{ backgroundColor: "#dc3545", color: "white" }}
                      >
                        Delete
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={!!selected} onClose={() => setSelected(null)} title="" size="md" styles={{ header: { display: "none" }, body: { padding: 0 } }}>
        {selected && (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ backgroundColor: "#111", padding: "20px 24px", position: "relative" }}>
              <button onClick={() => setSelected(null)} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontSize: "15px" }}>×</button>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Order</Text>
              <Text style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>{selected.product_name}</Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>{selected.quantity} {selected.unit}</Text>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ padding: "14px 20px", borderRight: "1px solid #f0f0f0" }}>
                <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Status</Text>
                <Badge color={selected.status === "approved" ? "green" : selected.status === "cancelled" ? "red" : "yellow"}>{selected.status}</Badge>
              </div>
              <div style={{ padding: "14px 20px" }}>
                <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Date</Text>
                <Text style={{ fontSize: "14px", fontWeight: "600" }}>{new Date(selected.created_at).toLocaleDateString()}</Text>
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #f0f0f0" }}>
              <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Client</Text>
              <Text style={{ fontSize: "16px", fontWeight: "700", color: "#111", marginBottom: "6px" }}>{selected.client_name}</Text>
              {selectedClient && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {selectedClient.company && <Text style={{ fontSize: "13px", color: "#555" }}>🏢 {selectedClient.company}</Text>}
                  {selectedClient.email && <Text style={{ fontSize: "13px", color: "#555" }}>✉️ {selectedClient.email}</Text>}
                  {selectedClient.phone && <Text style={{ fontSize: "13px", color: "#555" }}>📞 {selectedClient.phone}</Text>}
                  {selectedClient.address && <Text style={{ fontSize: "13px", color: "#555" }}>📍 {selectedClient.address}</Text>}
                  {selectedClient.notes && <Text style={{ fontSize: "12px", color: "#888", fontStyle: "italic", marginTop: "4px" }}>{selectedClient.notes}</Text>}
                </div>
              )}
            </div>
            {selected.status === "pending" && (
              <div style={{ padding: "14px 24px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <Button onClick={() => reject(selected.id)} style={{ backgroundColor: "#dc3545", color: "white" }}>Reject</Button>
                <Button onClick={() => approve(selected.id)} style={{ backgroundColor: "#28a745", color: "white" }}>Approve</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        opened={showDeleteModal} 
        onClose={() => !deletingOrder && setShowDeleteModal(false)} 
        title="" 
        centered
        size="sm"
        styles={{ 
          header: { display: "none" }, 
          body: { padding: "0" } 
        }}
      >
        <div style={{ 
          fontFamily: "Poppins, sans-serif", 
          textAlign: "center", 
          padding: "40px 30px 30px 30px" 
        }}>
          {/* Warning Icon */}
          <div style={{ 
            width: "60px", 
            height: "60px", 
            backgroundColor: "#dc3545", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 20px auto" 
          }}>
            <svg 
              width="30" 
              height="30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          
          {/* Confirmation Message */}
          <Text style={{ 
            fontSize: "20px", 
            fontWeight: "600", 
            marginBottom: "12px", 
            color: "#333" 
          }}>
            Delete Order?
          </Text>
          
          <Text style={{ 
            fontSize: "14px", 
            color: "#666", 
            marginBottom: "25px",
            lineHeight: "1.5"
          }}>
            {orderToDelete?.status === "fulfilled" 
              ? `This will delete the order and restore ${orderToDelete?.quantity} ${orderToDelete?.unit} of "${orderToDelete?.product_name}" back to inventory.`
              : "This action cannot be undone. The order will be permanently deleted."
            }
          </Text>
          
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <Button 
              onClick={() => setShowDeleteModal(false)}
              disabled={deletingOrder}
              style={{ 
                flex: 1,
                backgroundColor: "transparent", 
                color: "#666", 
                border: "1px solid #ddd",
                padding: "12px",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={deleteOrder}
              loading={deletingOrder}
              style={{ 
                flex: 1,
                backgroundColor: "#dc3545", 
                color: "#fff", 
                padding: "12px",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >
              {deletingOrder ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Success Modal */}
      <Modal 
        opened={showDeleteSuccessModal} 
        onClose={() => setShowDeleteSuccessModal(false)} 
        title="" 
        centered
        size="sm"
        styles={{ 
          header: { display: "none" }, 
          body: { padding: "0" } 
        }}
      >
        <div style={{ 
          fontFamily: "Poppins, sans-serif", 
          textAlign: "center", 
          padding: "40px 30px 30px 30px" 
        }}>
          {/* Success Icon */}
          <div style={{ 
            width: "60px", 
            height: "60px", 
            backgroundColor: "#28a745", 
            borderRadius: "50%", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 20px auto" 
          }}>
            <svg 
              width="30" 
              height="30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          </div>
          
          {/* Success Message */}
          <Text style={{ 
            fontSize: "20px", 
            fontWeight: "600", 
            marginBottom: "12px", 
            color: "#333" 
          }}>
            Order Deleted Successfully!
          </Text>
          
          <Text style={{ 
            fontSize: "14px", 
            color: "#666", 
            marginBottom: "25px",
            lineHeight: "1.5"
          }}>
            The order has been deleted and inventory has been updated accordingly.
          </Text>
          
          {/* Action Button */}
          <Button 
            onClick={() => setShowDeleteSuccessModal(false)} 
            fullWidth 
            style={{ 
              backgroundColor: "#28a745", 
              color: "#fff", 
              padding: "12px",
              fontSize: "14px",
              fontWeight: "600"
            }}
          >
            Continue
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function Dashboard() {
  const [currentPage] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>("po");
  const [activePoSubTab, setActivePoSubTab] = useState<string | null>("pending");
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDeliveryDate, setEditDeliveryDate] = useState("");
  const [editPaymentTerms, setEditPaymentTerms] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSuppliers, setEditSuppliers] = useState<Supplier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierDropdown, setSelectedSupplierDropdown] = useState<string | null>(null);
  const [showDeletePOConfirm, setShowDeletePOConfirm] = useState(false);
  const [poToDelete, setPoToDelete] = useState<string | null>(null);
  const [deletingPO, setDeletingPO] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (user?.role === "superadmin") {
      fetchPendingOrders();
      fetchNotifications();
      fetchUsers();
      fetchSuppliers();
    }
  }, [user]);

  const fetchPendingOrders = async () => {
    try {
      const res = await fetch("/api/purchase/orders");
      const data = await res.json();
      setAllOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?userId=superadmin");
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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users");
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const approvePO = async (poId: string) => {
    try {
      const po = allOrders.find((o) => o.id === poId);
      if (!po) return;

      await fetch("/api/purchase/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: poId,
          status: "approved",
          approvedBy: user?.username,
        }),
      });

      // Send to suppliers via WhatsApp if suppliers are assigned
      if (po.suppliers && po.suppliers.length > 0) {
        await fetch("/api/whatsapp/send-po", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suppliers: po.suppliers,
            poNumber: po.poNumber,
            items: po.items,
            deliveryDate: po.deliveryDate,
            paymentTerms: po.paymentTerms,
            totalAmount: po.totalAmount,
          }),
        });
      }

      setShowApprovalModal(false);
      setRejectionRemarks("");
      setIsEditMode(false);
      fetchPendingOrders();
      fetchNotifications();
    } catch (error) {
      console.error("Error approving PO:", error);
    }
  };

  const rejectPO = async (poId: string) => {
    if (!rejectionRemarks) {
      alert("Please add remarks for rejection");
      return;
    }
    try {
      await fetch("/api/purchase/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: poId,
          status: "rejected",
          rejectionRemarks,
        }),
      });
      setShowApprovalModal(false);
      setRejectionRemarks("");
      setIsEditMode(false);
      fetchPendingOrders();
      fetchNotifications();
    } catch (error) {
      console.error("Error rejecting PO:", error);
    }
  };

  const sendToSuppliers = async (order: any) => {
    try {
      // First, update the order status to sent_to_supplier
      await fetch("/api/purchase/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status: "sent_to_supplier",
        }),
      });

      // Create BOM sends for each supplier
      if (order.suppliers && order.suppliers.length > 0) {
        for (const supplier of order.suppliers) {
          // order.suppliers contains supplier objects, not IDs
          await fetch("/api/bom-sends", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bomId: order.id,
              bomNumber: order.poNumber,
              supplierId: supplier.id,
              supplierName: supplier.name,
              supplierPhone: supplier.phone,
              items: order.items,
            }),
          });
        }

        // Send via WhatsApp
        await fetch("/api/whatsapp/send-po", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            suppliers: order.suppliers, // order.suppliers already contains supplier objects
            poNumber: order.poNumber,
            items: order.items,
            deliveryDate: order.deliveryDate,
            paymentTerms: order.paymentTerms,
            totalAmount: order.totalAmount,
          }),
        });

        alert(`BOM ${order.poNumber} sent to ${order.suppliers.length} supplier(s) via WhatsApp`);
      } else {
        alert("No suppliers assigned to this BOM");
      }

      fetchPendingOrders();
    } catch (error) {
      console.error("Error sending BOM to suppliers:", error);
      alert("Error sending BOM to suppliers");
    }
  };

  const saveEditedPO = async (poId: string) => {
    try {
      await fetch("/api/purchase/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: poId,
          deliveryDate: editDeliveryDate,
          paymentTerms: editPaymentTerms,
          notes: editNotes,
          suppliers: editSuppliers,
        }),
      });
      setIsEditMode(false);
      setShowApprovalModal(false);
      fetchPendingOrders();
    } catch (error) {
      console.error("Error saving PO:", error);
    }
  };

  const addSupplierToEdit = () => {
    if (!selectedSupplierDropdown) {
      alert("Please select a supplier");
      return;
    }
    const supplier = suppliers.find((s) => s.id === selectedSupplierDropdown);
    if (supplier && !editSuppliers.find((s) => s.id === supplier.id)) {
      setEditSuppliers([...editSuppliers, supplier]);
      setSelectedSupplierDropdown(null);
    }
  };

  const removeSupplierFromEdit = (supplierId: string) => {
    setEditSuppliers(editSuppliers.filter((s) => s.id !== supplierId));
  };

  const generateWhatsAppLink = (supplier: Supplier, po: PurchaseOrder) => {
    const message = `Hello ${supplier.name},\n\nWe are interested in the following items:\n\n${po.items.map((item) => `- ${item.itemName}: ${item.quantity} ${item.unit}`).join("\n")}\n\nPlease provide your best rate with detailed breakdown including:\n- Unit Price\n- Transport Cost\n- Tax\n- Total Amount\n\nDelivery Required By: ${po.deliveryDate}\nPayment Terms: ${po.paymentTerms}\n\nPlease confirm availability and send your quotation.`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${supplier.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
  };

  const downloadBOMPDF = (order: PurchaseOrder) => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL OF MATERIALS', 20, 20);
    
    // BOM Details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`BOM Number: ${order.poNumber}`, 20, 35);
    doc.text(`Delivery Date: ${order.deliveryDate}`, 20, 42);
    doc.text(`Payment Terms: ${order.paymentTerms || 'N/A'}`, 20, 49);
    doc.text(`Status: ${order.status.replace(/_/g, ' ').toUpperCase()}`, 20, 56);
    doc.text(`Created By: ${order.createdBy}`, 20, 63);
    
    // Items Table Header
    doc.setFont('helvetica', 'bold');
    doc.text('Item Name', 20, 80);
    doc.text('Type', 90, 80);
    doc.text('Quantity', 130, 80);
    doc.text('Unit', 170, 80);
    doc.line(20, 82, 190, 82);
    
    // Items
    doc.setFont('helvetica', 'normal');
    let yPos = 90;
    order.items.forEach((item, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(item.itemName.substring(0, 30), 20, yPos);
      doc.text(item.itemType || 'N/A', 90, yPos);
      doc.text(item.quantity.toString(), 130, yPos);
      doc.text(item.unit, 170, yPos);
      yPos += 7;
    });
    
    // Total Amount
    yPos += 5;
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.line(20, yPos, 190, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: PKR ${order.totalAmount?.toFixed(2) || '0.00'}`, 20, yPos);
    
    // Notes
    if (order.notes) {
      yPos += 10;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(order.notes, 170);
      splitNotes.forEach((line: string) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, 20, yPos);
        yPos += 7;
      });
    }
    
    // Suppliers
    if (order.suppliers && order.suppliers.length > 0) {
      yPos += 10;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Suppliers:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      order.suppliers.forEach((supplier) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`- ${supplier.name} (${supplier.phone})`, 20, yPos);
        yPos += 7;
      });
    }
    
    doc.save(`BOM-${order.poNumber}.pdf`);
  };

  const exportToPDF = async (po: PurchaseOrder) => {
    try {
      // Create a temporary container for rendering
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "800px";
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.padding = "20px";
      tempContainer.style.fontFamily = "Poppins, sans-serif";
      tempContainer.style.fontSize = "12px";
      tempContainer.style.lineHeight = "1.5";
      
      // Build the content
      const content = `
        <div style="padding: 20px; background-color: white; font-family: Poppins, sans-serif;">
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">BILL OF MATERIAL</h2>
          <p style="margin: 5px 0; font-size: 12px;"><strong>BOM Number:</strong> ${po.poNumber}</p>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Created By:</strong> ${po.createdBy}</p>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Delivery Date:</strong> ${po.deliveryDate}</p>
          
          <h3 style="font-size: 13px; font-weight: 600; margin-top: 15px; margin-bottom: 10px;">Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="text-align: left; padding: 8px; font-size: 11px;">Item</th>
                <th style="text-align: left; padding: 8px; font-size: 11px;">Qty</th>
                <th style="text-align: left; padding: 8px; font-size: 11px;">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map((item) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px; font-size: 11px;">${item.itemName}</td>
                  <td style="padding: 8px; font-size: 11px;">${item.quantity}</td>
                  <td style="padding: 8px; font-size: 11px;">${item.unit}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      
      tempContainer.innerHTML = content;
      document.body.appendChild(tempContainer);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(tempContainer, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true
      });
      
      document.body.removeChild(tempContainer);
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${po.poNumber}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Error exporting to PDF: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const exportAsImage = async (po: PurchaseOrder) => {
    try {
      // Create a temporary container for rendering
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "800px";
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.padding = "20px";
      tempContainer.style.fontFamily = "Poppins, sans-serif";
      tempContainer.style.fontSize = "12px";
      tempContainer.style.lineHeight = "1.5";
      
      // Build the content
      const content = `
        <div style="padding: 20px; background-color: white; font-family: Poppins, sans-serif;">
          <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 15px;">BILL OF MATERIAL</h2>
          <p style="margin: 5px 0; font-size: 12px;"><strong>BOM Number:</strong> ${po.poNumber}</p>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Created By:</strong> ${po.createdBy}</p>
          <p style="margin: 5px 0; font-size: 12px;"><strong>Delivery Date:</strong> ${po.deliveryDate}</p>
          
          <h3 style="font-size: 13px; font-weight: 600; margin-top: 15px; margin-bottom: 10px;">Items:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="border-bottom: 1px solid #ccc;">
                <th style="text-align: left; padding: 8px; font-size: 11px;">Item</th>
                <th style="text-align: left; padding: 8px; font-size: 11px;">Qty</th>
                <th style="text-align: left; padding: 8px; font-size: 11px;">Unit</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map((item) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px; font-size: 11px;">${item.itemName}</td>
                  <td style="padding: 8px; font-size: 11px;">${item.quantity}</td>
                  <td style="padding: 8px; font-size: 11px;">${item.unit}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      
      tempContainer.innerHTML = content;
      document.body.appendChild(tempContainer);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(tempContainer, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true
      });
      
      document.body.removeChild(tempContainer);
      
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${po.poNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting as image:", error);
      alert("Error exporting as image: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const deletePO = async (poId: string) => {
    setPoToDelete(poId);
    setShowDeletePOConfirm(true);
  };

  const confirmDeletePO = async () => {
    if (!poToDelete) return;
    setDeletingPO(true);
    try {
      await fetch("/api/purchase/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: poToDelete }),
      });
      setShowApprovalModal(false);
      setShowDeletePOConfirm(false);
      setPoToDelete(null);
      fetchPendingOrders();
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting PO:", error);
    } finally {
      setDeletingPO(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const handleNotificationClick = (notif: any) => {
    // Dashboard - navigate based on notification type
    if (notif.type === "po_pending_approval") {
      // Already on dashboard, just close notification
      setShowNotifications(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "gray";
      case "pending_approval": return "yellow";
      case "approved": return "green";
      case "rejected": return "red";
      case "sent_to_supplier": return "blue";
      case "completed": return "teal";
      default: return "gray";
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
                  {!showNotifications && unreadCount > 0 && unreadCount}
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
              {user?.role === "superadmin" && (
                <Tabs value={activeTab} onChange={setActiveTab} style={{ marginTop: "0px" }}>
                  <Tabs.List>
                    <Tabs.Tab value="po" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Bills of Material
                    </Tabs.Tab>
                    <Tabs.Tab value="users" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Manage Users
                    </Tabs.Tab>
                    <Tabs.Tab value="client_orders" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Client Orders
                    </Tabs.Tab>
                  </Tabs.List>

                  {/* Bills of Material Tab */}
                  <Tabs.Panel value="po" style={{ paddingTop: "20px" }}>
                    <Tabs value={activePoSubTab} onChange={setActivePoSubTab}>
                      <Tabs.List>
                        <Tabs.Tab value="pending" style={{ fontFamily: "Poppins, sans-serif" }}>
                          Pending ({allOrders.filter((o) => o.status === "pending_approval").length})
                        </Tabs.Tab>
                        <Tabs.Tab value="approved" style={{ fontFamily: "Poppins, sans-serif" }}>
                          Approved ({allOrders.filter((o) => o.status === "approved").length})
                        </Tabs.Tab>
                      </Tabs.List>

                      {/* Pending Sub-Tab */}
                      <Tabs.Panel value="pending" style={{ paddingTop: "20px" }}>
                        {allOrders.filter((o) => o.status === "pending_approval").length === 0 ? (
                          <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                            No pending approvals.
                          </Text>
                        ) : (
                          <Table striped>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>BOM Number</Table.Th>
                                <Table.Th>Total Amount</Table.Th>
                                <Table.Th>Created By</Table.Th>
                                <Table.Th>Delivery Date</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Action</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {allOrders
                                .filter((order) => order.status === "pending_approval")
                                .map((order) => (
                                  <Table.Tr key={order.id}>
                                    <Table.Td>{order.poNumber}</Table.Td>
                                    <Table.Td>PKR {(order.totalAmount || 0).toFixed(2)}</Table.Td>
                                    <Table.Td>{order.createdBy}</Table.Td>
                                    <Table.Td>{order.deliveryDate}</Table.Td>
                                    <Table.Td>
                                      <Badge color="yellow">
                                        {order.status.replace(/_/g, " ")}
                                      </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <Button
                                          onClick={() => {
                                            setSelectedPO(order);
                                            setShowApprovalModal(true);
                                          }}
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
                                          Review
                                        </Button>
                                        <Button
                                          onClick={() => downloadBOMPDF(order)}
                                          size="xs"
                                          style={{
                                            backgroundColor: "#28a745",
                                            color: "#fff",
                                            border: "none",
                                            fontFamily: "Poppins, sans-serif",
                                            fontSize: "11px",
                                            padding: "6px 12px",
                                          }}
                                        >
                                          📄 PDF
                                        </Button>
                                      </div>
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                            </Table.Tbody>
                          </Table>
                        )}
                      </Tabs.Panel>

                      {/* Approved Sub-Tab */}
                      <Tabs.Panel value="approved" style={{ paddingTop: "20px" }}>
                        {allOrders.filter((o) => o.status === "approved").length === 0 ? (
                          <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                            No approved orders.
                          </Text>
                        ) : (
                          <Table striped>
                            <Table.Thead>
                              <Table.Tr>
                                <Table.Th>BOM Number</Table.Th>
                                <Table.Th>Total Amount</Table.Th>
                                <Table.Th>Created By</Table.Th>
                                <Table.Th>Delivery Date</Table.Th>
                                <Table.Th>Approved By</Table.Th>
                                <Table.Th>Action</Table.Th>
                              </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                              {allOrders
                                .filter((order) => order.status === "approved")
                                .map((order) => (
                                  <Table.Tr key={order.id}>
                                    <Table.Td>{order.poNumber}</Table.Td>
                                    <Table.Td>PKR {(order.totalAmount || 0).toFixed(2)}</Table.Td>
                                    <Table.Td>{order.createdBy}</Table.Td>
                                    <Table.Td>{order.deliveryDate}</Table.Td>
                                    <Table.Td>{order.approvedBy}</Table.Td>
                                    <Table.Td>
                                      <Group gap="8px">
                                        <Button
                                          onClick={() => {
                                            setSelectedPO(order);
                                            setShowApprovalModal(true);
                                          }}
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
                                          View
                                        </Button>
                                        {order.status === "sent_to_supplier" && (
                                          <Badge color="blue" size="sm">
                                            Sent to Suppliers
                                          </Badge>
                                        )}
                                        <Button
                                          onClick={() => deletePO(order.id)}
                                          size="xs"
                                          style={{
                                            backgroundColor: "transparent",
                                            color: "#dc3545",
                                            border: "1px solid #e0e0e0",
                                            fontFamily: "Poppins, sans-serif",
                                            fontSize: "11px",
                                            padding: "6px 12px",
                                          }}
                                        >
                                          Delete
                                        </Button>
                                      </Group>
                                    </Table.Td>
                                  </Table.Tr>
                                ))}
                            </Table.Tbody>
                          </Table>
                        )}
                      </Tabs.Panel>
                    </Tabs>
                  </Tabs.Panel>

                  {/* Users Tab */}
                  <Tabs.Panel value="users" style={{ paddingTop: "20px" }}>
                    {users.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                        No users found.
                      </Text>
                    ) : (
                      <Table striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Role</Table.Th>
                            <Table.Th>Modules</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {users.map((u) => (
                            <Table.Tr key={u.id}>
                              <Table.Td>{u.username}</Table.Td>
                              <Table.Td>{u.email}</Table.Td>
                              <Table.Td>{u.role}</Table.Td>
                              <Table.Td>{u.modules?.join(", ") || "N/A"}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>
                  <Tabs.Panel value="client_orders" style={{ paddingTop: "20px" }}>
                    <ClientOrdersPanel />
                  </Tabs.Panel>
                </Tabs>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Delete PO Confirm Modal */}
      {showDeletePOConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "28px", width: "380px", fontFamily: "Poppins, sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", backgroundColor: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", fontSize: "20px" }}>
              🗑️
            </div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#111", marginBottom: "8px" }}>Delete this PO?</div>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "24px", lineHeight: "1.5" }}>
              This action cannot be undone. The purchase order will be permanently deleted.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { setShowDeletePOConfirm(false); setPoToDelete(null); }}
                style={{ flex: 1, padding: "10px", border: "1px solid #e0e0e0", borderRadius: "8px", background: "white", fontSize: "13px", cursor: "pointer", fontFamily: "Poppins, sans-serif", color: "#555", fontWeight: "500" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePO}
                disabled={deletingPO}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: "#dc2626", color: "white", fontSize: "13px", cursor: deletingPO ? "not-allowed" : "pointer", fontFamily: "Poppins, sans-serif", fontWeight: "600", opacity: deletingPO ? 0.7 : 1 }}
              >
                {deletingPO ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      <Modal
        opened={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setRejectionRemarks("");
          setIsEditMode(false);
        }}
        title={isEditMode ? "Edit Bill of Material" : "Review Bill of Material"}
        size="lg"
      >
        {selectedPO && (
          <Box>
            {isEditMode ? (
              <>
                {/* Edit Mode */}
                <Box style={{ marginBottom: "20px" }}>
                  <Text style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                    Delivery Date
                  </Text>
                  <Input
                    type="date"
                    value={editDeliveryDate}
                    onChange={(e) => setEditDeliveryDate(e.currentTarget.value)}
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "13px",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      padding: "8px 12px",
                    }}
                  />
                </Box>

                <Box style={{ marginBottom: "20px" }}>
                  <Text style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                    Payment Terms
                  </Text>
                  <Input
                    value={editPaymentTerms}
                    onChange={(e) => setEditPaymentTerms(e.currentTarget.value)}
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "13px",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      padding: "8px 12px",
                    }}
                  />
                </Box>

                <Box style={{ marginBottom: "20px" }}>
                  <Text style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                    Notes
                  </Text>
                  <Input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.currentTarget.value)}
                    style={{
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "13px",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                      borderRadius: "4px",
                      padding: "8px 12px",
                    }}
                  />
                </Box>

                {/* Suppliers Edit Section */}
                <Box style={{ marginBottom: "20px" }}>
                  <Text style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                    Suppliers
                  </Text>
                  <Group style={{ marginBottom: "12px", gap: "8px" }}>
                    <Box style={{ flex: 1 }}>
                      <Select
                        placeholder="Select supplier"
                        data={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                        value={selectedSupplierDropdown}
                        onChange={setSelectedSupplierDropdown}
                        style={{ fontFamily: "Poppins, sans-serif" }}
                        styles={{
                          input: {
                            fontFamily: "Poppins, sans-serif",
                            fontSize: "13px",
                            backgroundColor: "#f5f5f5",
                            border: "1px solid #e0e0e0",
                            borderRadius: "4px",
                            padding: "8px 12px",
                          },
                        }}
                      />
                    </Box>
                    <Button
                      onClick={addSupplierToEdit}
                      style={{
                        backgroundColor: "transparent",
                        color: "#999",
                        border: "1px solid #e0e0e0",
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "12px",
                        padding: "8px 12px",
                      }}
                      size="xs"
                    >
                      Add
                    </Button>
                  </Group>

                  {editSuppliers.length > 0 && (
                    <Box style={{ marginBottom: "12px" }}>
                      <Table striped style={{ marginBottom: "12px" }}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th style={{ fontSize: "11px" }}>Name</Table.Th>
                            <Table.Th style={{ fontSize: "11px" }}>Email</Table.Th>
                            <Table.Th style={{ fontSize: "11px" }}>Phone</Table.Th>
                            <Table.Th style={{ fontSize: "11px" }}>Action</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {editSuppliers.map((supplier) => (
                            <Table.Tr key={supplier.id}>
                              <Table.Td style={{ fontSize: "11px" }}>{supplier.name}</Table.Td>
                              <Table.Td style={{ fontSize: "11px" }}>{supplier.email}</Table.Td>
                              <Table.Td style={{ fontSize: "11px" }}>{supplier.phone}</Table.Td>
                              <Table.Td>
                                <Button
                                  onClick={() => removeSupplierFromEdit(supplier.id)}
                                  size="xs"
                                  style={{
                                    backgroundColor: "transparent",
                                    color: "#999",
                                    border: "1px solid #e0e0e0",
                                    fontFamily: "Poppins, sans-serif",
                                    fontSize: "10px",
                                    padding: "4px 8px",
                                  }}
                                >
                                  Remove
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  )}
                </Box>

                <Group style={{ gap: "8px" }}>
                  <Button
                    onClick={() => saveEditedPO(selectedPO.id)}
                    style={{
                      backgroundColor: "transparent",
                      color: "#999",
                      border: "1px solid #e0e0e0",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "12px",
                      padding: "8px 16px",
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setIsEditMode(false)}
                    style={{
                      backgroundColor: "transparent",
                      color: "#999",
                      border: "1px solid #e0e0e0",
                      fontFamily: "Poppins, sans-serif",
                      fontSize: "12px",
                      padding: "8px 16px",
                    }}
                  >
                    Cancel
                  </Button>
                </Group>
              </>
            ) : (
              <>
                {/* View Mode */}
                <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>
                  BOM Number: {selectedPO.poNumber}
                </Text>
                <Text style={{ marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                  Created By: {selectedPO.createdBy}
                </Text>
                <Text style={{ marginBottom: "20px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                  Total Amount: PKR {(selectedPO.totalAmount || 0).toFixed(2)}
                </Text>

                <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                  Items:
                </Text>
                <Table striped style={{ marginBottom: "20px" }}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ fontSize: "11px" }}>Item</Table.Th>
                      <Table.Th style={{ fontSize: "11px" }}>Qty</Table.Th>
                      <Table.Th style={{ fontSize: "11px" }}>Unit Price</Table.Th>
                      <Table.Th style={{ fontSize: "11px" }}>Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedPO.items.map((item: any) => (
                      <Table.Tr key={item.id}>
                        <Table.Td style={{ fontSize: "11px" }}>{item.itemName}</Table.Td>
                        <Table.Td style={{ fontSize: "11px" }}>{item.quantity}</Table.Td>
                        <Table.Td style={{ fontSize: "11px" }}>PKR {(item.unitPrice || 0).toFixed(2)}</Table.Td>
                        <Table.Td style={{ fontSize: "11px" }}>PKR {(item.totalPrice || 0).toFixed(2)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>

                {/* Suppliers Section */}
                <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                  Suppliers:
                </Text>
                {selectedPO.suppliers && selectedPO.suppliers.length > 0 ? (
                  <Table striped style={{ marginBottom: "20px" }}>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ fontSize: "11px" }}>Name</Table.Th>
                        <Table.Th style={{ fontSize: "11px" }}>Email</Table.Th>
                        <Table.Th style={{ fontSize: "11px" }}>Phone</Table.Th>
                        <Table.Th style={{ fontSize: "11px" }}>Address</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedPO.suppliers.map((supplier: any) => (
                        <Table.Tr key={supplier.id}>
                          <Table.Td style={{ fontSize: "11px" }}>{supplier.name}</Table.Td>
                          <Table.Td style={{ fontSize: "11px" }}>{supplier.email}</Table.Td>
                          <Table.Td style={{ fontSize: "11px" }}>{supplier.phone}</Table.Td>
                          <Table.Td style={{ fontSize: "11px" }}>{supplier.address}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Box style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                    <Text style={{ fontSize: "11px", color: "#999", fontFamily: "Poppins, sans-serif" }}>
                      No suppliers assigned
                    </Text>
                  </Box>
                )}

                {selectedPO.status === "pending_approval" ? (
                  <>
                    <Box style={{ marginBottom: "20px" }}>
                      <Text style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", fontFamily: "Poppins, sans-serif" }}>
                        Rejection Remarks (if rejecting)
                      </Text>
                      <Textarea
                        placeholder="Add remarks if rejecting..."
                        value={rejectionRemarks}
                        onChange={(e) => setRejectionRemarks(e.currentTarget.value)}
                        style={{
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "12px",
                          backgroundColor: "#f5f5f5",
                          border: "1px solid #e0e0e0",
                          borderRadius: "4px",
                          padding: "8px 12px",
                        }}
                        rows={3}
                      />
                    </Box>

                    <Group style={{ gap: "8px" }}>
                      <Button
                        onClick={() => {
                          setEditDeliveryDate(selectedPO.deliveryDate);
                          setEditPaymentTerms(selectedPO.paymentTerms);
                          setEditNotes(selectedPO.notes);
                          setEditSuppliers(selectedPO.suppliers || []);
                          setIsEditMode(true);
                        }}
                        style={{
                          backgroundColor: "transparent",
                          color: "#999",
                          border: "1px solid #e0e0e0",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "12px",
                          padding: "8px 16px",
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => approvePO(selectedPO.id)}
                        style={{
                          backgroundColor: "transparent",
                          color: "#999",
                          border: "1px solid #e0e0e0",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "12px",
                          padding: "8px 16px",
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectPO(selectedPO.id)}
                        style={{
                          backgroundColor: "transparent",
                          color: "#999",
                          border: "1px solid #e0e0e0",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "12px",
                          padding: "8px 16px",
                        }}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => deletePO(selectedPO.id)}
                        style={{
                          backgroundColor: "transparent",
                          color: "#999",
                          border: "1px solid #e0e0e0",
                          fontFamily: "Poppins, sans-serif",
                          fontSize: "12px",
                          padding: "8px 16px",
                        }}
                      >
                        Delete
                      </Button>
                    </Group>
                  </>
                ) : selectedPO.status === "rejected" ? (
                  <Box>
                    <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                      Rejection Remarks:
                    </Text>
                    <Box style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                      <Text style={{ fontSize: "11px", fontFamily: "Poppins, sans-serif" }}>
                        {selectedPO.rejectionRemarks || "No remarks provided"}
                      </Text>
                    </Box>
                    <Button
                      onClick={() => deletePO(selectedPO.id)}
                      style={{
                        backgroundColor: "transparent",
                        color: "#999",
                        border: "1px solid #e0e0e0",
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "12px",
                        padding: "8px 16px",
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                ) : selectedPO.status === "approved" ? (
                  <Box>
                    <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                      Approval Status:
                    </Text>
                    <Box style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                      <Text style={{ fontSize: "11px", fontFamily: "Poppins, sans-serif" }}>
                        This BOM has been approved by {selectedPO.approvedBy}
                      </Text>
                    </Box>

                    {/* Suppliers with WhatsApp Links */}
                    {selectedPO.suppliers && selectedPO.suppliers.length > 0 && (
                      <Box style={{ marginBottom: "20px" }}>
                        <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                          Send to Suppliers:
                        </Text>
                        {selectedPO.suppliers.map((supplier) => (
                          <Box
                            key={supplier.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px",
                              backgroundColor: "#f9f9f9",
                              borderRadius: "4px",
                              marginBottom: "8px",
                              border: "1px solid #e0e0e0",
                            }}
                          >
                            <Box>
                              <Text style={{ fontSize: "11px", fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                                {supplier.name}
                              </Text>
                              <Text style={{ fontSize: "10px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                                {supplier.phone}
                              </Text>
                            </Box>
                            <a
                              href={generateWhatsAppLink(supplier, selectedPO)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: "none" }}
                            >
                              <Button
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "4px" }}>
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.946 1.347l-.355.192-.368-.06a9.879 9.879 0 00-3.464.608l.564 2.173 1.888-.959a9.877 9.877 0 018.368 1.215l.341-.292a9.87 9.87 0 013.101-1.61l-.667-2.633-.365.06a9.864 9.864 0 00-3.1-.608zM12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z" />
                                </svg>
                                WhatsApp
                              </Button>
                            </a>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Export Options */}
                    <Box style={{ marginBottom: "20px" }}>
                      <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }}>
                        Export:
                      </Text>
                      <Group gap="8px">
                        <Button
                          onClick={() => exportToPDF(selectedPO)}
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
                          Export as PDF
                        </Button>
                        <Button
                          onClick={() => exportAsImage(selectedPO)}
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
                          Export as Image
                        </Button>
                      </Group>
                    </Box>

                    <Button
                      onClick={() => deletePO(selectedPO.id)}
                      style={{
                        backgroundColor: "transparent",
                        color: "#999",
                        border: "1px solid #e0e0e0",
                        fontFamily: "Poppins, sans-serif",
                        fontSize: "12px",
                        padding: "8px 16px",
                      }}
                    >
                      Delete
                    </Button>

                    {/* Hidden content for export */}
                    <Box id={`po-content-${selectedPO.id}`} style={{ display: "none" }}>
                      <Box style={{ padding: "20px", backgroundColor: "white", fontFamily: "Poppins, sans-serif" }}>
                        <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "14px" }}>
                          PURCHASE ORDER
                        </Text>
                        <Text style={{ marginBottom: "5px", fontSize: "12px" }}>
                          BOM Number: {selectedPO.poNumber}
                        </Text>
                        <Text style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Created By: {selectedPO.createdBy}
                        </Text>
                        <Text style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Approved By: {selectedPO.approvedBy}
                        </Text>
                        <Text style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Delivery Date: {selectedPO.deliveryDate}
                        </Text>
                        <Text style={{ marginBottom: "5px", fontSize: "12px" }}>
                          Payment Terms: {selectedPO.paymentTerms}
                        </Text>
                        <Text style={{ marginBottom: "15px", fontSize: "12px", fontWeight: "600" }}>
                          Total Amount: PKR {(selectedPO.totalAmount || 0).toFixed(2)}
                        </Text>

                        <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px" }}>
                          Items:
                        </Text>
                        {selectedPO.items.map((item) => (
                          <Box key={item.id} style={{ marginBottom: "8px", fontSize: "11px" }}>
                            <Text>
                              {item.itemName} - {item.quantity} {item.unit} @ PKR {(item.unitPrice || 0).toFixed(2)} = PKR {(item.totalPrice || 0).toFixed(2)}
                            </Text>
                          </Box>
                        ))}

                        {selectedPO.suppliers && selectedPO.suppliers.length > 0 && (
                          <Box style={{ marginTop: "15px" }}>
                            <Text style={{ fontWeight: "600", marginBottom: "10px", fontSize: "12px" }}>
                              Suppliers:
                            </Text>
                            {selectedPO.suppliers.map((supplier) => (
                              <Box key={supplier.id} style={{ marginBottom: "8px", fontSize: "11px" }}>
                                <Text>
                                  {supplier.name} - {supplier.phone} - {supplier.email}
                                </Text>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ) : null}
              </>
            )}
          </Box>
        )}
      </Modal>
    </ProtectedRoute>
  );
}
