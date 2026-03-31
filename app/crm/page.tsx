"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
  const [loading, setLoading] = useState(true);
  const [showClientDetailModal, setShowClientDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailTab, setClientDetailTab] = useState<string | null>("info");
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderData, setNewOrderData] = useState({ clientId: "", productId: "", itemName: "", quantity: 1, unit: "pieces", notes: "" });
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const [sendingToFinance, setSendingToFinance] = useState(false);
  const [showFinanceSuccessModal, setShowFinanceSuccessModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadClients(), loadOrders(), loadProducts()]);
    setLoading(false);
  };

  const loadClients = async () => {
    const res = await fetch("/api/crm/clients");
    const data = await res.json();
    setClients(Array.isArray(data) ? data : []);
  };

  const loadProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(Array.isArray(data) ? data : []);
  };

  const loadOrders = async () => {
    const res = await fetch("/api/crm/orders");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
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

  const handleCreateNewOrder = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!newOrderData.clientId || !newOrderData.itemName || !newOrderData.quantity) {
      alert("Please fill in all required fields");
      return;
    }

    const selectedClient = clients.find(c => c.id === newOrderData.clientId);
    
    if (!selectedClient) {
      alert("Invalid client selection");
      return;
    }

    setCreatingOrder(true);

    try {
      // Get unit from selected product if productId exists, otherwise use manual unit
      let finalUnit = newOrderData.unit;
      if (newOrderData.productId) {
        const selectedProduct = products.find(p => p.id === newOrderData.productId);
        if (selectedProduct) {
          finalUnit = selectedProduct.unit;
        }
      }

      await fetch("/api/crm/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: newOrderData.clientId,
          clientName: selectedClient.name,
          productName: newOrderData.itemName,
          quantity: newOrderData.quantity,
          unit: finalUnit,
          unitPrice: 0,
          notes: newOrderData.notes,
          createdBy: user.username
        })
      });

      setShowNewOrderModal(false);
      setNewOrderData({ clientId: "", productId: "", itemName: "", quantity: 1, unit: "pieces", notes: "" });
      loadOrders();
      
      // Show custom success modal
      setShowOrderSuccessModal(true);
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setCreatingOrder(false);
    }
  };

  const pendingOrders = (orders || []).filter(o => o.status === "pending");
  const approvedOrders = (orders || []).filter(o => o.status === "approved" || o.status === "sent_to_finance" || o.status === "po_sent" || o.status === "payment_confirmed" || o.status === "fulfilled");

  if (loading) {
    return (
      <ProtectedRoute>
        <Box style={{ width: "100%", minHeight: "100vh", backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", fontFamily: "Poppins, sans-serif" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #000", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <Text style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>Loading CRM data...</Text>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </Box>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <style>{`
        .crm-main-container {
          width: 100%;
          min-height: 100vh;
          background-color: white;
          font-family: Poppins, sans-serif;
        }
        
        .crm-content-wrapper {
          padding: 20px;
          margin-left: 240px;
          max-width: 1400px;
        }
        
        .crm-content-box {
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 30px;
          margin-top: 40px;
        }
        
        @media (max-width: 1024px) {
          .crm-content-wrapper {
            max-width: 100%;
          }
        }
        
        @media (max-width: 768px) {
          .crm-content-wrapper {
            margin-left: 0;
            padding: 16px;
            padding-top: 70px;
          }
          
          .crm-content-box {
            border: none;
            padding: 16px;
            margin-top: 0;
          }
        }
        
        @media (max-width: 480px) {
          .crm-content-wrapper {
            padding: 12px;
          }
          
          .crm-content-box {
            padding: 12px;
          }
        }
      `}</style>
      
      <div className="crm-main-container">
        <Navigation currentPage={currentPage} />

        <div className="crm-content-wrapper">
          <div className="crm-content-box">
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
                  <>
                    {/* Desktop Table */}
                    <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "auto", display: "block" }} className="desktop-table">
                      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
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
                            <tr 
                              key={client.id} 
                              style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                              onClick={() => { setSelectedClient(client); setClientDetailTab("info"); setShowClientDetailModal(true); }}
                            >
                              <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{client.name}</td>
                              <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{client.email}</td>
                              <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{client.phone}</td>
                              <td style={{ padding: "16px", fontSize: "13px", color: "#333" }}>{client.company}</td>
                              <td style={{ padding: "16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
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
                    
                    {/* Mobile Cards */}
                    <div className="mobile-cards" style={{ display: "none" }}>
                      {clients.map((client) => (
                        <div 
                          key={client.id}
                          style={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e0e0e0", 
                            borderRadius: "8px",
                            padding: "16px",
                            marginBottom: "12px",
                            cursor: "pointer"
                          }}
                          onClick={() => { setSelectedClient(client); setClientDetailTab("info"); setShowClientDetailModal(true); }}
                        >
                          <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>{client.name}</div>
                          <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{client.email}</div>
                          <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{client.phone}</div>
                          <div style={{ fontSize: "13px", color: "#666", marginBottom: "12px" }}>{client.company}</div>
                          <div style={{ display: "flex", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => { setEditingClient(client); setNewClient(client); setClientModalOpen(true); }} 
                              style={{ flex: 1, padding: "8px", backgroundColor: "white", color: "#000", border: "1px solid #e0e0e0", fontSize: "12px", cursor: "pointer", borderRadius: "4px" }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClient(client.id)} 
                              style={{ flex: 1, padding: "8px", backgroundColor: "white", color: "#dc3545", border: "1px solid #e0e0e0", fontSize: "12px", cursor: "pointer", borderRadius: "4px" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <style>{`
                      @media (max-width: 768px) {
                        .desktop-table { display: none !important; }
                        .mobile-cards { display: block !important; }
                      }
                    `}</style>
                  </>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="orders" pt="md">
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                  <button
                    onClick={() => setShowNewOrderModal(true)}
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
                    + New Order
                  </button>
                </div>
                
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
                                        
                                        // Try to find the product price from products array
                                        const matchingProduct = products.find(p => 
                                          p.name.toLowerCase() === order.product_name.toLowerCase()
                                        );
                                        
                                        const defaultUnitPrice = matchingProduct ? matchingProduct.price : (order.unit_price || 0);
                                        
                                        setPricingDetails({ 
                                          unitPrice: defaultUnitPrice, 
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
              
              {(() => {
                const matchingProduct = products.find(p => 
                  p.name.toLowerCase() === selectedOrder.product_name.toLowerCase()
                );
                
                if (matchingProduct && pricingDetails.unitPrice === matchingProduct.price) {
                  return (
                    <div style={{ 
                      backgroundColor: "#e8f5e9", 
                      padding: "8px 12px", 
                      borderRadius: "4px", 
                      marginTop: "6px",
                      fontSize: "11px",
                      color: "#2e7d32"
                    }}>
                      ✓ Price auto-loaded from product catalog (PKR {matchingProduct.price.toLocaleString()})
                    </div>
                  );
                }
                
                return null;
              })()}

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
                  
                  setSendingToFinance(true);
                  
                  try {
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
                      setShowFinanceSuccessModal(true);
                    } else {
                      alert("Failed to update order. Please try again.");
                    }
                  } catch (error) {
                    console.error("Error sending to finance:", error);
                    alert("Failed to send order to finance. Please try again.");
                  } finally {
                    setSendingToFinance(false);
                  }
                }}
                mt="xl"
                fullWidth
                style={{ backgroundColor: "#6f42c1", color: "white" }}
                disabled={sendingToFinance}
              >
                {sendingToFinance ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <div style={{ 
                      width: "16px", 
                      height: "16px", 
                      border: "2px solid #fff", 
                      borderTop: "2px solid transparent", 
                      borderRadius: "50%", 
                      animation: "spin 1s linear infinite" 
                    }}></div>
                    Sending to Finance...
                  </div>
                ) : (
                  "Send to Finance"
                )}
              </Button>
              
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
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
                  {selectedOrder.status === "fulfilled" && (
                    <span style={{ padding: "4px 8px", backgroundColor: "#007bff", color: "white", borderRadius: "4px", fontSize: "10px", fontWeight: "600" }}>
                      ✓ Fulfilled
                    </span>
                  )}
                </div>
              </div>

              <Tabs defaultValue="order" style={{ padding: "0 20px" }}>
                <Tabs.List>
                  <Tabs.Tab value="order" style={{ fontSize: "12px" }}>Order Details</Tabs.Tab>
                  {(selectedOrder.status === "payment_confirmed" || selectedOrder.status === "fulfilled") && selectedOrder.payment_confirmed_at && (
                    <Tabs.Tab value="payment" style={{ fontSize: "12px" }}>Payment Details</Tabs.Tab>
                  )}
                </Tabs.List>

                <Tabs.Panel value="order" pt="md" pb="md">
                  <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: "16px", marginBottom: "16px" }}>
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

                  <div>
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
                </Tabs.Panel>

                <Tabs.Panel value="payment" pt="md" pb="md">
                  <div style={{ backgroundColor: "#d4edda", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "12px", color: "#155724", textAlign: "center" }}>
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>✓ Payment Confirmed</div>
                    <div style={{ fontSize: "11px" }}>
                      Confirmed by {selectedOrder.payment_confirmed_by} on {new Date(selectedOrder.payment_confirmed_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                    <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px" }}>Payment Information</Text>
                    
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #e0e0e0" }}>
                        <span style={{ fontSize: "12px", color: "#666" }}>Payment Amount:</span>
                        <span style={{ fontSize: "14px", fontWeight: "700", color: "#28a745" }}>PKR {Number(selectedOrder.payment_amount || 0).toFixed(2)}</span>
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                        <span style={{ color: "#666" }}>Payment Method:</span>
                        <span style={{ fontWeight: "600" }}>{selectedOrder.payment_method?.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                        <span style={{ color: "#666" }}>Confirmed By:</span>
                        <span style={{ fontWeight: "600" }}>{selectedOrder.payment_confirmed_by}</span>
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#666" }}>Confirmed On:</span>
                        <span style={{ fontWeight: "600" }}>{new Date(selectedOrder.payment_confirmed_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {selectedOrder.payment_screenshot && (
                      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
                        <Text style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>Payment Screenshot/Receipt</Text>
                        <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                          <img 
                            src={selectedOrder.payment_screenshot} 
                            alt="Payment screenshot" 
                            style={{ maxWidth: "100%", maxHeight: "300px", display: "block", margin: "0 auto", borderRadius: "4px" }} 
                          />
                        </div>
                      </div>
                    )}

                    {selectedOrder.payment_notes && (
                      <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
                        <Text style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px" }}>Payment Notes</Text>
                        <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "4px", border: "1px solid #e0e0e0", fontSize: "12px", color: "#333" }}>
                          {selectedOrder.payment_notes}
                        </div>
                      </div>
                    )}
                  </div>
                </Tabs.Panel>
              </Tabs>
            </div>
          )}
        </Modal>

        <Modal opened={showClientDetailModal} onClose={() => { setShowClientDetailModal(false); setSelectedClient(null); }} title="" size="lg" styles={{ header: { display: "none" }, body: { padding: 0 } }}>
          {selectedClient && (
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              <div style={{ backgroundColor: "#111", padding: "20px 24px", position: "relative" }}>
                <button onClick={() => { setShowClientDetailModal(false); setSelectedClient(null); }} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer" }}>×</button>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Client Profile</Text>
                <Text style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>{selectedClient.name}</Text>
              </div>

              <Tabs value={clientDetailTab} onChange={setClientDetailTab} style={{ padding: "0 24px" }}>
                <Tabs.List>
                  <Tabs.Tab value="info" style={{ fontSize: "13px" }}>Personal Information</Tabs.Tab>
                  <Tabs.Tab value="orders" style={{ fontSize: "13px" }}>Orders ({(orders || []).filter(o => o.client_id === selectedClient.id).length})</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="info" pt="md" pb="md">
                  <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px" }}>
                    <div style={{ marginBottom: "16px" }}>
                      <Text style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Full Name</Text>
                      <Text style={{ fontSize: "15px", fontWeight: "600" }}>{selectedClient.name}</Text>
                    </div>

                    {selectedClient.email && (
                      <div style={{ marginBottom: "16px" }}>
                        <Text style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Email</Text>
                        <Text style={{ fontSize: "14px" }}>{selectedClient.email}</Text>
                      </div>
                    )}

                    {selectedClient.phone && (
                      <div style={{ marginBottom: "16px" }}>
                        <Text style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Phone</Text>
                        <Text style={{ fontSize: "14px" }}>{selectedClient.phone}</Text>
                      </div>
                    )}

                    {selectedClient.company && (
                      <div style={{ marginBottom: "16px" }}>
                        <Text style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Company</Text>
                        <Text style={{ fontSize: "14px" }}>{selectedClient.company}</Text>
                      </div>
                    )}

                    {selectedClient.address && (
                      <div style={{ marginBottom: "16px" }}>
                        <Text style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Address</Text>
                        <Text style={{ fontSize: "14px" }}>{selectedClient.address}</Text>
                      </div>
                    )}

                    {selectedClient.notes && (
                      <div>
                        <Text style={{ fontSize: "11px", color: "#666", textTransform: "uppercase", marginBottom: "4px" }}>Notes</Text>
                        <Text style={{ fontSize: "14px", color: "#666" }}>{selectedClient.notes}</Text>
                      </div>
                    )}
                  </div>
                </Tabs.Panel>

                <Tabs.Panel value="orders" pt="md" pb="md">
                  {(() => {
                    const clientOrders = (orders || []).filter(o => o.client_id === selectedClient.id);
                    const pendingClientOrders = clientOrders.filter(o => o.status === "pending");
                    const completedClientOrders = clientOrders.filter(o => o.status !== "pending");

                    return (
                      <div>
                        {clientOrders.length === 0 ? (
                          <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                            No orders yet for this client.
                          </Text>
                        ) : (
                          <Tabs defaultValue="completed">
                            <Tabs.List>
                              <Tabs.Tab value="pending" style={{ fontSize: "12px" }}>
                                Pending ({pendingClientOrders.length})
                              </Tabs.Tab>
                              <Tabs.Tab value="completed" style={{ fontSize: "12px" }}>
                                Completed ({completedClientOrders.length})
                              </Tabs.Tab>
                            </Tabs.List>

                            <Tabs.Panel value="pending" pt="sm">
                              {pendingClientOrders.length === 0 ? (
                                <Text style={{ color: "#999", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                                  No pending orders.
                                </Text>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                  {pendingClientOrders.map((order) => (
                                    <div key={order.id} style={{ backgroundColor: "#fff3cd", padding: "12px", borderRadius: "6px", border: "1px solid #ffc107" }}>
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <Text style={{ fontSize: "14px", fontWeight: "600" }}>{order.product_name}</Text>
                                        <span style={{ padding: "2px 8px", backgroundColor: "#ffc107", color: "#000", borderRadius: "4px", fontSize: "10px", fontWeight: "600" }}>
                                          PENDING
                                        </span>
                                      </div>
                                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                                        Quantity: {order.quantity} {order.unit}
                                      </div>
                                      <div style={{ fontSize: "12px", color: "#666" }}>
                                        Date: {new Date(order.created_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Tabs.Panel>

                            <Tabs.Panel value="completed" pt="sm">
                              {completedClientOrders.length === 0 ? (
                                <Text style={{ color: "#999", fontSize: "13px", textAlign: "center", padding: "20px" }}>
                                  No completed orders.
                                </Text>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                  {completedClientOrders.map((order) => (
                                    <div 
                                      key={order.id} 
                                      style={{ backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "6px", border: "1px solid #e0e0e0", cursor: "pointer" }}
                                      onClick={() => { setSelectedOrder(order); setShowOrderDetailModal(true); setShowClientDetailModal(false); }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                        <Text style={{ fontSize: "14px", fontWeight: "600" }}>{order.product_name}</Text>
                                        <span style={{ 
                                          padding: "2px 8px", 
                                          backgroundColor: order.status === "fulfilled" ? "#007bff" : order.status === "payment_confirmed" ? "#28a745" : "#6f42c1", 
                                          color: "white", 
                                          borderRadius: "4px", 
                                          fontSize: "10px", 
                                          fontWeight: "600" 
                                        }}>
                                          {order.status === "fulfilled" ? "FULFILLED" : order.status === "payment_confirmed" ? "PAID" : order.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                      </div>
                                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                                        Quantity: {order.quantity} {order.unit}
                                      </div>
                                      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>
                                        Total: PKR {Number(order.total_price || 0).toFixed(2)}
                                      </div>
                                      <div style={{ fontSize: "12px", color: "#666" }}>
                                        Date: {new Date(order.created_at).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Tabs.Panel>
                          </Tabs>
                        )}
                      </div>
                    );
                  })()}
                </Tabs.Panel>
              </Tabs>
            </div>
          )}
        </Modal>

        <Modal opened={showNewOrderModal} onClose={() => { setShowNewOrderModal(false); setNewOrderData({ clientId: "", productId: "", itemName: "", quantity: 1, unit: "pieces", notes: "" }); }} title="Create New Order" size="md">
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ marginBottom: "16px" }}>
              <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Select Client</Text>
              <Select 
                placeholder="Choose a client"
                data={clients.map(c => ({ value: c.id, label: `${c.name}${c.company ? ' - ' + c.company : ''}` }))} 
                value={newOrderData.clientId} 
                onChange={(val) => setNewOrderData({ ...newOrderData, clientId: val || "" })}
                searchable
                required
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Item/Product Name</Text>
              <Select 
                placeholder="Select a product or type custom item"
                data={[
                  { value: "custom", label: "➕ Custom Item (Type Below)" },
                  ...products.map(p => ({ 
                    value: p.id, 
                    label: `${p.name} (Stock: ${p.stock} ${p.unit})` 
                  }))
                ]} 
                value={newOrderData.productId || undefined}
                onChange={(val) => {
                  if (val === "custom") {
                    setNewOrderData({ ...newOrderData, productId: "", itemName: "" });
                  } else if (val) {
                    const product = products.find(p => p.id === val);
                    if (product) {
                      setNewOrderData({ 
                        ...newOrderData, 
                        productId: val, 
                        itemName: product.name,
                        unit: product.unit 
                      });
                    }
                  }
                }}
                searchable
                required
              />
              
              {(!newOrderData.productId || newOrderData.productId === "custom") && (
                <TextInput 
                  placeholder="e.g., Gaming Mouse RGB"
                  value={newOrderData.itemName} 
                  onChange={(e) => setNewOrderData({ ...newOrderData, itemName: e.target.value, productId: "" })}
                  required
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Quantity</Text>
                <NumberInput 
                  placeholder="Enter quantity"
                  value={newOrderData.quantity} 
                  onChange={(val) => setNewOrderData({ ...newOrderData, quantity: Number(val) || 1 })} 
                  min={1}
                  required
                />
              </div>

              <div>
                <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Unit</Text>
                <Select 
                  data={[
                    { value: "pieces", label: "Pieces" },
                    { value: "kg", label: "KG" },
                    { value: "lbs", label: "LBS" },
                    { value: "meters", label: "Meters" },
                    { value: "liters", label: "Liters" },
                    { value: "boxes", label: "Boxes" },
                    { value: "cartons", label: "Cartons" },
                    { value: "units", label: "Units" },
                  ]} 
                  value={newOrderData.unit} 
                  onChange={(val) => setNewOrderData({ ...newOrderData, unit: val || "pieces" })}
                  disabled={!!newOrderData.productId && newOrderData.productId !== "custom"}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Order Notes (Optional)</Text>
              <Textarea 
                placeholder="Add any special requirements, delivery instructions, or notes..."
                value={newOrderData.notes} 
                onChange={(e) => setNewOrderData({ ...newOrderData, notes: e.target.value })} 
                rows={3}
              />
            </div>

            <div style={{ backgroundColor: "#f0f7ff", padding: "12px", borderRadius: "6px", marginBottom: "20px", border: "1px solid #d0e7ff" }}>
              <Text style={{ fontSize: "11px", color: "#0066cc", lineHeight: "1.5" }}>
                ℹ️ This order will be sent to superadmin for approval. Pricing details will be added after approval.
              </Text>
            </div>

            <Button 
              onClick={handleCreateNewOrder} 
              fullWidth 
              style={{ backgroundColor: "#000", color: "#fff", padding: "10px" }}
              disabled={!newOrderData.clientId || !newOrderData.itemName || !newOrderData.quantity || creatingOrder}
            >
              {creatingOrder ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <div style={{ 
                    width: "16px", 
                    height: "16px", 
                    border: "2px solid #fff", 
                    borderTop: "2px solid transparent", 
                    borderRadius: "50%", 
                    animation: "spin 1s linear infinite" 
                  }}></div>
                  Creating Order...
                </div>
              ) : (
                "Create Order"
              )}
            </Button>
            
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </Modal>

        {/* Order Success Modal */}
        <Modal 
          opened={showOrderSuccessModal} 
          onClose={() => setShowOrderSuccessModal(false)} 
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
              Order Created Successfully!
            </Text>
            
            <Text style={{ 
              fontSize: "14px", 
              color: "#666", 
              marginBottom: "25px",
              lineHeight: "1.5"
            }}>
              Your order has been created and sent for approval. You'll be notified once it's reviewed.
            </Text>
            
            {/* Action Button */}
            <Button 
              onClick={() => setShowOrderSuccessModal(false)} 
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

        {/* Finance Success Modal */}
        <Modal 
          opened={showFinanceSuccessModal} 
          onClose={() => setShowFinanceSuccessModal(false)} 
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
              backgroundColor: "#6f42c1", 
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
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
              </svg>
            </div>
            
            {/* Success Message */}
            <Text style={{ 
              fontSize: "20px", 
              fontWeight: "600", 
              marginBottom: "12px", 
              color: "#333" 
            }}>
              Order Sent to Finance!
            </Text>
            
            <Text style={{ 
              fontSize: "14px", 
              color: "#666", 
              marginBottom: "25px",
              lineHeight: "1.5"
            }}>
              The order with pricing details has been successfully sent to the finance team for processing.
            </Text>
            
            {/* Action Button */}
            <Button 
              onClick={() => setShowFinanceSuccessModal(false)} 
              fullWidth 
              style={{ 
                backgroundColor: "#6f42c1", 
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
