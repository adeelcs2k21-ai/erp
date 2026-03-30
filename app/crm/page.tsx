"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";
import { Navigation } from "@/components/Navigation";
import { Box, Button, Table, Modal, TextInput, Textarea, Select, NumberInput, Text, Tabs } from "@mantine/core";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
  created_at: string;
}

interface Order {
  id: string;
  client_id: string;
  client_name: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  status: string;
  notes: string;
  created_at: string;
  tax?: number;
  transport?: number;
  other_charges?: number;
  other_charges_notes?: string;
  po_number?: string;
  po_sent_at?: string;
  payment_amount?: number;
  payment_method?: string;
  payment_screenshot?: string;
  payment_notes?: string;
  payment_confirmed_at?: string;
  payment_confirmed_by?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  category: string;
}

export default function CRMPage() {
  const [currentPage] = useState(7); // CRM is at index 7
  const [activeTab, setActiveTab] = useState<string | null>("clients");
  const [orderSubTab, setOrderSubTab] = useState<string | null>("pending");
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [pricingDetails, setPricingDetails] = useState({ unitPrice: 0, tax: 0, transport: 0, other: 0, otherNotes: "" });
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "", company: "", address: "", notes: "" });
  const [orderDetails, setOrderDetails] = useState({ productId: "", quantity: 1, notes: "" });

  useEffect(() => {
    loadClients();
    loadOrders();
    loadProducts();
  }, []);

  const loadClients = async () => {
    const res = await fetch("/api/crm/clients");
    const data = await res.json();
    setClients(data);
  };

  const loadProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  const loadOrders = async () => {
    const res = await fetch("/api/crm/orders");
    const data = await res.json();
    setOrders(data);
  };

  const handleSaveClient = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (editingClient) {
      // Just update client
      await fetch("/api/crm/clients", { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ ...editingClient, ...newClient }) 
      });
      setClientModalOpen(false);
      setEditingClient(null);
      setNewClient({ name: "", email: "", phone: "", company: "", address: "", notes: "" });
      loadClients();
    } else {
      // Create client and order
      if (!newClient.name) {
        alert("Client name is required");
        return;
      }
      
      // Create client
      const clientRes = await fetch("/api/crm/clients", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ ...newClient, createdBy: user.username }) 
      });
      const clientData = await clientRes.json();
      
      // Create order if product selected
      if (orderDetails.productId) {
        const selectedProduct = products.find(p => p.id === orderDetails.productId);
        if (selectedProduct) {
          await fetch("/api/crm/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: clientData.id,
              clientName: newClient.name,
              productName: selectedProduct.name,
              quantity: orderDetails.quantity,
              unit: selectedProduct.unit,
              unitPrice: selectedProduct.price,
              notes: orderDetails.notes,
              createdBy: user.username
            })
          });
        }
      }
      
      setShowSuccessModal(true);
      setClientModalOpen(false);
      setNewClient({ name: "", email: "", phone: "", company: "", address: "", notes: "" });
      setOrderDetails({ productId: "", quantity: 1, notes: "" });
      loadClients();
      loadOrders();
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm("Delete this client?")) {
      await fetch("/api/crm/clients", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      loadClients();
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (confirm("Delete this order?")) {
      await fetch("/api/crm/orders", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      loadOrders();
    }
  };

  const pendingOrders = orders.filter(o => o.status === "pending");
  const approvedOrders = orders.filter(o => o.status === "approved" || o.status === "sent_to_finance" || o.status === "po_sent" || o.status === "payment_confirmed");

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

        <Box
          style={{
            marginLeft: "200px",
            flex: 1,
            paddingBottom: "100px",
          }}
        >
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
            <Text style={{ fontSize: "18px", fontWeight: "500", fontFamily: "Poppins, sans-serif", marginBottom: "24px" }}>
              CRM - Customer Relationship Management
            </Text>

            <Tabs value={activeTab} onChange={setActiveTab} style={{ fontFamily: "Poppins, sans-serif" }}>
              <Tabs.List>
                <Tabs.Tab value="clients" style={{ fontSize: "14px", fontWeight: "400" }}>Clients</Tabs.Tab>
                <Tabs.Tab value="orders" style={{ fontSize: "14px", fontWeight: "400" }}>Orders</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="clients" pt="md">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <Text style={{ fontSize: "16px", fontWeight: "500" }}>Client List</Text>
                  <button
                    onClick={() => { setEditingClient(null); setClientModalOpen(true); }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "white",
                      color: "#000",
                      border: "1px solid #e0e0e0",
                      fontSize: "13px",
                      fontWeight: "400",
                      cursor: "pointer",
                    }}
                  >
                    + Add Client
                  </button>
                </div>

                {clients.length === 0 ? (
                  <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                    No clients yet.
                  </Text>
                ) : (
                  <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</th>
                          <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Company</th>
                          <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((client) => (
                          <tr key={client.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{client.name}</td>
                            <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{client.email}</td>
                            <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{client.phone}</td>
                            <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{client.company}</td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                                <button onClick={() => { setEditingClient(client); setNewClient(client); setClientModalOpen(true); }} style={{ padding: "6px 12px", backgroundColor: "white", color: "#000", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                                <button onClick={() => handleDeleteClient(client.id)} style={{ padding: "6px 12px", backgroundColor: "white", color: "#dc3545", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="orders" pt="md">
                <Tabs value={orderSubTab} onChange={setOrderSubTab}>
                  <Tabs.List>
                    <Tabs.Tab value="pending" style={{ fontSize: "13px" }}>
                      Pending ({pendingOrders.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="approved" style={{ fontSize: "13px" }}>
                      Approved ({approvedOrders.length})
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="pending" pt="md">
                    {pendingOrders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                        No pending orders.
                      </Text>
                    ) : (
                      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unit Price</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pendingOrders.map((order) => (
                              <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{order.client_name}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{order.product_name}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{order.quantity} {order.unit}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>PKR {order.unit_price}</td>
                                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#28a745" }}>PKR {order.total_price}</td>
                                <td style={{ padding: "16px", fontSize: "12px", color: "#888" }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: "16px", textAlign: "center" }}>
                                  <button onClick={() => handleDeleteOrder(order.id)} style={{ padding: "6px 12px", backgroundColor: "white", color: "#dc3545", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="approved" pt="md">
                    {approvedOrders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                        No approved orders yet.
                      </Text>
                    ) : (
                      <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Client</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Product</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quantity</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Unit Price</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</th>
                              <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Date</th>
                              <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {approvedOrders.map((order) => (
                              <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => { setSelectedOrder(order); setShowOrderDetailModal(true); }}>
                                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{order.client_name}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{order.product_name}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{order.quantity} {order.unit}</td>
                                <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>PKR {order.unit_price}</td>
                                <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#28a745" }}>PKR {order.total_price}</td>
                                <td style={{ padding: "16px", fontSize: "12px", color: "#888" }}>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td style={{ padding: "16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                                  {order.status === "approved" ? (
                                    <button 
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setPricingDetails({ 
                                          unitPrice: order.unit_price || 0, 
                                          tax: 0, 
                                          transport: 0,
                                          other: 0,
                                          otherNotes: ""
                                        });
                                        setShowPricingModal(true);
                                      }}
                                      style={{ padding: "6px 12px", backgroundColor: "#6f42c1", color: "white", border: "1px solid #6f42c1", fontSize: "11px", cursor: "pointer" }}
                                    >
                                      Move to Finance
                                    </button>
                                  ) : order.status === "sent_to_finance" ? (
                                    <button 
                                      disabled
                                      style={{ padding: "6px 12px", backgroundColor: "#e0e0e0", color: "#999", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "not-allowed" }}
                                    >
                                      Sent to Finance
                                    </button>
                                  ) : order.status === "po_sent" ? (
                                    <button 
                                      disabled
                                      style={{ padding: "6px 12px", backgroundColor: "#d4edda", color: "#155724", border: "1px solid #c3e6cb", fontSize: "11px", cursor: "not-allowed" }}
                                    >
                                      Sent to Client
                                    </button>
                                  ) : order.status === "payment_confirmed" ? (
                                    <button 
                                      disabled
                                      style={{ padding: "6px 12px", backgroundColor: "#d1ecf1", color: "#0c5460", border: "1px solid #bee5eb", fontSize: "11px", cursor: "not-allowed" }}
                                    >
                                      Payment Confirmed
                                    </button>
                                  ) : null}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Tabs.Panel>
                </Tabs>
              </Tabs.Panel>
            </Tabs>

        <Modal opened={clientModalOpen} onClose={() => { setClientModalOpen(false); setEditingClient(null); setNewClient({ name: "", email: "", phone: "", company: "", address: "", notes: "" }); setOrderDetails({ productId: "", quantity: 1, notes: "" }); }} title={editingClient ? "Edit Client" : "Add Client"} size="lg">
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px", color: "#333" }}>Client Information</Text>
            <TextInput label="Name *" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} required styles={{ label: { fontSize: "13px" } }} />
            <TextInput label="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} mt="sm" styles={{ label: { fontSize: "13px" } }} />
            <TextInput label="Phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} mt="sm" styles={{ label: { fontSize: "13px" } }} />
            <TextInput label="Company" value={newClient.company} onChange={(e) => setNewClient({ ...newClient, company: e.target.value })} mt="sm" styles={{ label: { fontSize: "13px" } }} />
            <Textarea label="Address" value={newClient.address} onChange={(e) => setNewClient({ ...newClient, address: e.target.value })} mt="sm" styles={{ label: { fontSize: "13px" } }} />
            <Textarea label="Notes" value={newClient.notes} onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })} mt="sm" styles={{ label: { fontSize: "13px" } }} />
            
            {!editingClient && (
              <>
                <Text style={{ fontSize: "14px", fontWeight: "600", marginTop: "24px", marginBottom: "16px", color: "#333" }}>Order Details (Optional)</Text>
                <Select 
                  label="Product" 
                  placeholder="Select a product"
                  data={products.filter(p => p.stock > 0).map(p => ({ value: p.id, label: `${p.name} (Stock: ${p.stock} ${p.unit}, Price: PKR ${p.price})` }))} 
                  value={orderDetails.productId} 
                  onChange={(val) => setOrderDetails({ ...orderDetails, productId: val || "" })}
                  styles={{ label: { fontSize: "13px" } }}
                  searchable
                />
                {orderDetails.productId && (
                  <>
                    <NumberInput 
                      label="Quantity" 
                      value={orderDetails.quantity} 
                      onChange={(val) => setOrderDetails({ ...orderDetails, quantity: Number(val) })} 
                      mt="sm" 
                      min={1}
                      max={products.find(p => p.id === orderDetails.productId)?.stock || 1}
                      styles={{ label: { fontSize: "13px" } }}
                    />
                    <Textarea 
                      label="Order Notes" 
                      value={orderDetails.notes} 
                      onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })} 
                      mt="sm"
                      styles={{ label: { fontSize: "13px" } }}
                    />
                  </>
                )}
              </>
            )}
            
            <Button onClick={handleSaveClient} mt="xl" fullWidth style={{ backgroundColor: "#000", color: "#fff" }}>
              {editingClient ? "Update Client" : "Add Client"}
            </Button>
          </div>
        </Modal>

        <Modal opened={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Success" centered>
          <div style={{ textAlign: "center", padding: "20px", fontFamily: "Poppins, sans-serif" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
            <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>Client Created Successfully!</Text>
            <Text style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
              {orderDetails.productId ? "Order has been sent to superadmin for approval." : "Client has been added to the system."}
            </Text>
            <Button onClick={() => setShowSuccessModal(false)} fullWidth style={{ backgroundColor: "#28a745", color: "#fff" }}>
              OK
            </Button>
          </div>
        </Modal>

        <Modal opened={showPricingModal} onClose={() => { setShowPricingModal(false); setSelectedOrder(null); }} title="Add Pricing Details" size="md">
          {selectedOrder && (
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>{selectedOrder.product_name}</Text>
                <Text style={{ fontSize: "13px", color: "#666" }}>Client: {selectedOrder.client_name}</Text>
                <Text style={{ fontSize: "13px", color: "#666" }}>Quantity: {selectedOrder.quantity} {selectedOrder.unit}</Text>
              </div>

              <NumberInput 
                label="Unit Price (PKR) *" 
                value={pricingDetails.unitPrice} 
                onChange={(val) => setPricingDetails({ ...pricingDetails, unitPrice: Number(val) || 0 })}
                min={0}
                step={0.01}
                styles={{ label: { fontSize: "13px", fontWeight: "600" } }}
                required
              />

              <NumberInput 
                label="Tax (PKR)" 
                value={pricingDetails.tax} 
                onChange={(val) => setPricingDetails({ ...pricingDetails, tax: Number(val) || 0 })}
                min={0}
                step={0.01}
                mt="md"
                styles={{ label: { fontSize: "13px", fontWeight: "600" } }}
              />

              <NumberInput 
                label="Transport Cost (PKR)" 
                value={pricingDetails.transport} 
                onChange={(val) => setPricingDetails({ ...pricingDetails, transport: Number(val) || 0 })}
                min={0}
                step={0.01}
                mt="md"
                styles={{ label: { fontSize: "13px", fontWeight: "600" } }}
              />

              <NumberInput 
                label="Other Charges (PKR)" 
                value={pricingDetails.other} 
                onChange={(val) => setPricingDetails({ ...pricingDetails, other: Number(val) || 0 })}
                min={0}
                step={0.01}
                mt="md"
                styles={{ label: { fontSize: "13px", fontWeight: "600" } }}
              />

              <Textarea 
                label="Notes for Other Charges" 
                placeholder="Describe other charges..."
                value={pricingDetails.otherNotes} 
                onChange={(e) => setPricingDetails({ ...pricingDetails, otherNotes: e.target.value })}
                mt="sm"
                styles={{ label: { fontSize: "13px", fontWeight: "600" } }}
                rows={2}
              />

              <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <Text>Subtotal:</Text>
                  <Text>PKR {(pricingDetails.unitPrice * selectedOrder.quantity).toFixed(2)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <Text>Tax:</Text>
                  <Text>PKR {pricingDetails.tax.toFixed(2)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <Text>Transport:</Text>
                  <Text>PKR {pricingDetails.transport.toFixed(2)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px", paddingBottom: "12px", borderBottom: "1px solid #e0e0e0" }}>
                  <Text>Other Charges:</Text>
                  <Text>PKR {pricingDetails.other.toFixed(2)}</Text>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px", fontWeight: "700" }}>
                  <Text>Total:</Text>
                  <Text style={{ color: "#28a745" }}>PKR {((pricingDetails.unitPrice * selectedOrder.quantity) + pricingDetails.tax + pricingDetails.transport + pricingDetails.other).toFixed(2)}</Text>
                </div>
              </div>

              <Button 
                onClick={async () => {
                  if (pricingDetails.unitPrice <= 0) {
                    alert("Please enter a valid unit price");
                    return;
                  }
                  
                  const totalPrice = (pricingDetails.unitPrice * selectedOrder.quantity) + pricingDetails.tax + pricingDetails.transport + pricingDetails.other;
                  
                  const response = await fetch("/api/crm/orders", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: selectedOrder.id,
                      status: "sent_to_finance",
                      unitPrice: pricingDetails.unitPrice,
                      totalPrice: totalPrice,
                      tax: pricingDetails.tax,
                      transport: pricingDetails.transport,
                      otherCharges: pricingDetails.other,
                      otherChargesNotes: pricingDetails.otherNotes
                    })
                  });
                  
                  if (response.ok) {
                    setShowPricingModal(false);
                    setSelectedOrder(null);
                    setPricingDetails({ unitPrice: 0, tax: 0, transport: 0, other: 0, otherNotes: "" });
                    await loadOrders();
                    alert("Order sent to finance successfully!");
                  } else {
                    alert("Failed to update order. Please try again.");
                  }
                }}
                mt="xl"
                fullWidth
                style={{ backgroundColor: "#6f42c1", color: "white" }}
              >
                Send to Finance
              </Button>
            </div>
          )}
        </Modal>

        <Modal opened={showOrderDetailModal} onClose={() => { setShowOrderDetailModal(false); setSelectedOrder(null); }} title="" size="md" styles={{ header: { display: "none" }, body: { padding: 0 } }}>
          {selectedOrder && (
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              <div style={{ backgroundColor: "#111", padding: "16px 20px", position: "relative" }}>
                <button onClick={() => { setShowOrderDetailModal(false); setSelectedOrder(null); }} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "14px" }}>×</button>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>Client Order</Text>
                <Text style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>{selectedOrder.product_name}</Text>
                <div style={{ marginTop: "8px" }}>
                  {selectedOrder.status === "approved" && (
                    <span style={{ padding: "4px 8px", backgroundColor: "#d4edda", color: "#155724", borderRadius: "4px", fontSize: "10px", fontWeight: "600" }}>
                      Approved
                    </span>
                  )}
                  {selectedOrder.status === "sent_to_finance" && (
                    <span style={{ padding: "4px 8px", backgroundColor: "#e3d5f7", color: "#6f42c1", borderRadius: "4px", fontSize: "10px", fontWeight: "600" }}>
                      Sent to Finance
                    </span>
                  )}
                  {selectedOrder.status === "po_sent" && (
                    <span style={{ padding: "4px 8px", backgroundColor: "#d1ecf1", color: "#0c5460", borderRadius: "4px", fontSize: "10px", fontWeight: "600" }}>
                      Sent to Client
                    </span>
                  )}
                  {selectedOrder.status === "payment_confirmed" && (
                    <span style={{ padding: "4px 8px", backgroundColor: "#d4edda", color: "#155724", borderRadius: "4px", fontSize: "10px", fontWeight: "600" }}>
                      ✓ Payment Confirmed
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
                <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Client Information</Text>
                {(() => {
                  const client = clients.find(c => c.id === selectedOrder.client_id);
                  return client ? (
                    <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
                      <div><strong>Name:</strong> {client.name}</div>
                      {client.email && <div><strong>Email:</strong> {client.email}</div>}
                      {client.phone && <div><strong>Phone:</strong> {client.phone}</div>}
                    </div>
                  ) : <Text style={{ color: "#999", fontSize: "12px" }}>Client information not available</Text>;
                })()}
              </div>

              <div style={{ padding: "16px 20px" }}>
                <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Order Details</Text>
                <div style={{ backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "6px", fontSize: "12px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <Text style={{ fontWeight: "600", fontSize: "13px", marginBottom: "6px" }}>{selectedOrder.product_name}</Text>
                    <div style={{ color: "#666" }}>Quantity: {selectedOrder.quantity} {selectedOrder.unit}</div>
                  </div>

                  <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "10px" }}>
                    <Text style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Price Breakdown</Text>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Text>Unit Price:</Text>
                      <Text style={{ fontWeight: "600" }}>PKR {Number(selectedOrder.unit_price || 0).toFixed(2)}</Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Text>Quantity:</Text>
                      <Text>× {selectedOrder.quantity}</Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid #e0e0e0" }}>
                      <Text style={{ fontWeight: "600" }}>Product Subtotal:</Text>
                      <Text style={{ fontWeight: "600" }}>PKR {(Number(selectedOrder.unit_price || 0) * selectedOrder.quantity).toFixed(2)}</Text>
                    </div>

                    <Text style={{ fontSize: "11px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Additional Charges</Text>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Text>Tax:</Text>
                      <Text>PKR {Number(selectedOrder.tax || 0).toFixed(2)}</Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Text>Transport Cost:</Text>
                      <Text>PKR {Number(selectedOrder.transport || 0).toFixed(2)}</Text>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <Text>Other Charges:</Text>
                      <Text>PKR {Number(selectedOrder.other_charges || 0).toFixed(2)}</Text>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "12px", borderTop: "2px solid #333", fontSize: "14px", fontWeight: "700" }}>
                      <Text>Grand Total:</Text>
                      <Text style={{ color: "#28a745" }}>PKR {Number(selectedOrder.total_price || 0).toFixed(2)}</Text>
                    </div>

                    <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#e8f5e9", borderRadius: "4px", fontSize: "11px", color: "#2e7d32" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text>Cost per piece (including all charges):</Text>
                        <Text style={{ fontWeight: "600" }}>PKR {(Number(selectedOrder.total_price || 0) / selectedOrder.quantity).toFixed(2)}</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
          </Box>
        </Box>
        <LogoutButton />
      </Box>
    </ProtectedRoute>
  );
}
