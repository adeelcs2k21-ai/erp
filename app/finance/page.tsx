"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Tabs, Table, Badge, Modal } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function ClientOrdersPanel() {
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<string | null>("pending");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalTab, setModalTab] = useState<string | null>("details");
  const [paymentDetails, setPaymentDetails] = useState({ amount: 0, method: "", screenshot: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [approvedSearch, setApprovedSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadClientOrders(), loadClients()]);
    setLoading(false);
  };

  const loadClientOrders = async () => {
    const res = await fetch("/api/crm/orders");
    const data = await res.json();
    setClientOrders(data.filter((o: any) => o.status === "sent_to_finance" || o.status === "po_sent" || o.status === "payment_confirmed" || o.status === "fulfilled"));
  };

  const loadClients = async () => {
    const res = await fetch("/api/crm/clients");
    const data = await res.json();
    setClients(data);
  };

  const handleSendToClient = async (order: any) => {
    const client = clients.find(c => c.id === order.client_id);
    
    // Try phone, then company field as fallback, then default number
    const rawPhone = client?.phone || client?.company || "923001234567";
    const phone = rawPhone.replace(/[^0-9]/g, '') || "923001234567";
    
    const message = `*Order Confirmation*\n\nDear ${client?.name || order.client_name},\n\nYour order has been confirmed:\n\n*Product:* ${order.product_name}\n*Quantity:* ${order.quantity} ${order.unit}\n*Unit Price:* PKR ${Number(order.unit_price || 0).toFixed(2)}\n*Tax:* PKR ${Number(order.tax || 0).toFixed(2)}\n*Transport:* PKR ${Number(order.transport || 0).toFixed(2)}\n*Other Charges:* PKR ${Number(order.other_charges || 0).toFixed(2)}\n\n*Total Amount:* PKR ${Number(order.total_price || 0).toFixed(2)}\n\nPlease proceed with the payment.\n\nThank you!`;
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Update order status to po_sent
    await fetch("/api/crm/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status: "po_sent" })
    });
    
    await loadClientOrders();
    setShowOrderModal(false);
  };

  const pendingOrders = clientOrders.filter(o => o.status === "sent_to_finance" || o.status === "po_sent");
  const approvedOrders = clientOrders.filter(o => o.status === "payment_confirmed" || o.status === "fulfilled");

  if (loading) {
    return (
      <div style={{ fontFamily: "Poppins, sans-serif", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", flexDirection: "column" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid #f3f3f3", borderTop: "4px solid #000", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <Text style={{ marginTop: "16px", fontSize: "14px", color: "#666" }}>Loading orders...</Text>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif" }}>
      <Tabs value={orderSubTab} onChange={setOrderSubTab}>
        <Tabs.List>
          <Tabs.Tab value="pending" style={{ fontSize: "13px" }}>
            Pending Orders ({pendingOrders.length})
          </Tabs.Tab>
          <Tabs.Tab value="approved" style={{ fontSize: "13px" }}>
            Payment Confirmed ({approvedOrders.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pending" pt="md">
          {pendingOrders.length === 0 ? (
            <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              No pending client orders.
            </Text>
          ) : (
            <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Client</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Product</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Quantity</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Total</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => { setSelectedOrder(order); setModalTab("details"); setPaymentDetails({ amount: order.total_price, method: "", screenshot: "", notes: "" }); setShowOrderModal(true); }}>
                      <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{order.client_name}</td>
                      <td style={{ padding: "16px", fontSize: "13px" }}>{order.product_name}</td>
                      <td style={{ padding: "16px", fontSize: "13px" }}>{order.quantity} {order.unit}</td>
                      <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#28a745" }}>PKR {order.total_price}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button style={{ padding: "6px 12px", backgroundColor: "#007bff", color: "white", border: "none", fontSize: "11px", cursor: "pointer" }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="approved" pt="md">
          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search client or product..."
              value={approvedSearch}
              onChange={e => setApprovedSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "Poppins, sans-serif" }}
            />
          </div>
          {(() => {
            const q = approvedSearch.toLowerCase();
            const filtered = approvedOrders.filter(o =>
              !q ||
              o.client_name?.toLowerCase().includes(q) ||
              o.product_name?.toLowerCase().includes(q) ||
              o.payment_method?.toLowerCase().includes(q)
            );
            return filtered.length === 0 ? (
              <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
                {approvedSearch ? "No matching orders found." : "No payment confirmed orders yet."}
              </Text>
            ) : (
              <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Client</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Product</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Quantity</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Total</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order) => (
                      <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}
                        onClick={() => { setSelectedOrder(order); setModalTab("details"); setShowOrderModal(true); }}>
                        <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600" }}>{order.client_name}</td>
                        <td style={{ padding: "16px", fontSize: "13px" }}>{order.product_name}</td>
                        <td style={{ padding: "16px", fontSize: "13px" }}>{order.quantity} {order.unit}</td>
                        <td style={{ padding: "16px", fontSize: "13px", fontWeight: "600", color: "#28a745" }}>PKR {order.total_price}</td>
                        <td style={{ padding: "16px", fontSize: "12px", color: "#28a745" }}>
                          <div style={{ fontWeight: "600" }}>✓ Confirmed</div>
                          <div style={{ fontSize: "11px", color: "#666" }}>{order.payment_method?.replace('_', ' ').toUpperCase()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </Tabs.Panel>
      </Tabs>

      <Modal opened={showOrderModal} onClose={() => { setShowOrderModal(false); setModalTab("details"); }} title="" size="lg" styles={{ header: { display: "none" }, body: { padding: 0 } }}>
        {selectedOrder && (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ backgroundColor: "#111", padding: "20px 24px", position: "relative" }}>
              <button onClick={() => { setShowOrderModal(false); setModalTab("details"); }} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer" }}>×</button>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Client Order</Text>
              <Text style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>{selectedOrder.product_name}</Text>
            </div>
            
            <Tabs value={modalTab} onChange={setModalTab} style={{ padding: "0 24px" }}>
              <Tabs.List>
                <Tabs.Tab value="details" style={{ fontSize: "13px" }}>Order Details</Tabs.Tab>
                {selectedOrder.status === "po_sent" && selectedOrder.po_sent_at && (
                  <Tabs.Tab value="payment" style={{ fontSize: "13px" }}>Add Payment</Tabs.Tab>
                )}
                {(selectedOrder.status === "payment_confirmed" || selectedOrder.status === "fulfilled") && selectedOrder.payment_confirmed_at && (
                  <Tabs.Tab value="payment-details" style={{ fontSize: "13px" }}>Payment Details</Tabs.Tab>
                )}
              </Tabs.List>

              <Tabs.Panel value="details" pt="md" pb="md">
                <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Client Information</Text>
                {(() => {
                  const client = clients.find(c => c.id === selectedOrder.client_id);
                  return client ? (
                    <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                      <div style={{ marginBottom: "8px" }}><strong>Name:</strong> {client.name}</div>
                      <div style={{ marginBottom: "8px" }}><strong>Email:</strong> {client.email}</div>
                      <div style={{ marginBottom: "8px" }}><strong>Phone:</strong> {client.phone}</div>
                      {client.company && <div style={{ marginBottom: "8px" }}><strong>Company:</strong> {client.company}</div>}
                      {client.address && <div><strong>Address:</strong> {client.address}</div>}
                    </div>
                  ) : null;
                })()}

                <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Order Details</Text>
                <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                  <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e0e0e0" }}>
                    <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "8px" }}>{selectedOrder.product_name}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>Quantity: {selectedOrder.quantity} {selectedOrder.unit}</div>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <Text style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Price Breakdown</Text>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span>Unit Price:</span>
                      <span style={{ fontWeight: "600" }}>PKR {Number(selectedOrder.unit_price || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span>Quantity:</span>
                      <span>× {selectedOrder.quantity}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #e0e0e0", fontSize: "13px" }}>
                      <span style={{ fontWeight: "600" }}>Product Subtotal:</span>
                      <span style={{ fontWeight: "600" }}>PKR {(Number(selectedOrder.unit_price || 0) * selectedOrder.quantity).toFixed(2)}</span>
                    </div>

                    <Text style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Additional Charges</Text>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span>Tax:</span>
                      <span>PKR {Number(selectedOrder.tax || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span>Transport Cost:</span>
                      <span>PKR {Number(selectedOrder.transport || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span>Other Charges:</span>
                      <span>PKR {Number(selectedOrder.other_charges || 0).toFixed(2)}</span>
                    </div>
                    {selectedOrder.other_charges_notes && (
                      <div style={{ fontSize: "11px", color: "#666", fontStyle: "italic", marginLeft: "8px", marginBottom: "8px" }}>
                        • {selectedOrder.other_charges_notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "2px solid #333", fontSize: "17px", fontWeight: "700" }}>
                    <span>Grand Total:</span>
                    <span style={{ color: "#28a745" }}>PKR {Number(selectedOrder.total_price || 0).toFixed(2)}</span>
                  </div>

                  <div style={{ marginTop: "12px", padding: "10px", backgroundColor: "#e8f5e9", borderRadius: "6px", fontSize: "12px", color: "#2e7d32" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Cost per piece (including all charges):</span>
                      <span style={{ fontWeight: "600" }}>PKR {(Number(selectedOrder.total_price || 0) / selectedOrder.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.status === "po_sent" && selectedOrder.po_sent_at && (
                  <div style={{ width: "100%", backgroundColor: "#d4edda", padding: "10px", borderRadius: "4px", fontSize: "11px", color: "#155724", textAlign: "center", marginBottom: "12px" }}>
                    ✓ Sent to client on {new Date(selectedOrder.po_sent_at).toLocaleString()}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Button 
                    onClick={() => handleSendToClient(selectedOrder)}
                    fullWidth 
                    style={{ 
                      backgroundColor: selectedOrder.po_sent_at ? "#e8f5e9" : "#25D366", 
                      color: selectedOrder.po_sent_at ? "#2e7d32" : "white",
                      border: selectedOrder.po_sent_at ? "1px solid #c3e6cb" : "none"
                    }}
                    title={selectedOrder.po_sent_at ? "Already sent to client" : "Send to client"}
                  >
                    📱 Send to Client via WhatsApp
                    {selectedOrder.po_sent_at && <span style={{ fontSize: "10px", marginLeft: "8px", opacity: 0.7 }}>(Already Sent)</span>}
                  </Button>
                </div>
              </Tabs.Panel>

              <Tabs.Panel value="payment" pt="md" pb="md">
                <div style={{ backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "12px" }}>
                  <Text style={{ fontWeight: "600", marginBottom: "4px" }}>{selectedOrder.product_name}</Text>
                  <Text style={{ color: "#666" }}>Client: {selectedOrder.client_name}</Text>
                  <Text style={{ color: "#666" }}>Total: PKR {Number(selectedOrder.total_price || 0).toFixed(2)}</Text>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Payment Amount (PKR) *</label>
                  <input 
                    type="number"
                    value={paymentDetails.amount} 
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, amount: Number(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                    style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: "4px", fontSize: "13px" }}
                    required
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Payment Method *</label>
                  <select 
                    value={paymentDetails.method} 
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, method: e.target.value })}
                    style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: "4px", fontSize: "13px" }}
                    required
                  >
                    <option value="">Select payment method</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Payment Screenshot/Reference</label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPaymentDetails({ ...paymentDetails, screenshot: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: "4px", fontSize: "13px" }}
                  />
                  <Text style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Upload payment screenshot or receipt</Text>
                  {paymentDetails.screenshot && (
                    <div style={{ marginTop: "8px" }}>
                      <img src={paymentDetails.screenshot} alt="Payment screenshot" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "4px", border: "1px solid #e0e0e0" }} />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>Payment Notes</label>
                  <textarea 
                    placeholder="Add any additional payment details..."
                    value={paymentDetails.notes} 
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                    rows={3}
                    style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: "4px", fontSize: "13px", resize: "vertical" }}
                  />
                </div>

                <Button 
                  onClick={async () => {
                    if (!paymentDetails.method || paymentDetails.amount <= 0) {
                      alert("Please fill in all required fields");
                      return;
                    }

                    const user = JSON.parse(localStorage.getItem("user") || "{}");
                    
                    const response = await fetch("/api/crm/orders", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: selectedOrder.id,
                        status: "payment_confirmed",
                        paymentAmount: paymentDetails.amount,
                        paymentMethod: paymentDetails.method,
                        paymentScreenshot: paymentDetails.screenshot,
                        paymentNotes: paymentDetails.notes,
                        confirmedBy: user.username
                      })
                    });
                    
                    if (response.ok) {
                      setShowOrderModal(false);
                      setModalTab("details");
                      setPaymentDetails({ amount: 0, method: "", screenshot: "", notes: "" });
                      await loadClientOrders();
                      alert("Payment confirmed! Order will be sent to inventory.");
                    } else {
                      alert("Failed to confirm payment. Please try again.");
                    }
                  }}
                  fullWidth
                  style={{ backgroundColor: "#28a745", color: "white", padding: "10px", fontSize: "14px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}
                >
                  Confirm Payment
                </Button>
              </Tabs.Panel>

              <Tabs.Panel value="payment-details" pt="md" pb="md">
                <div style={{ backgroundColor: "#d4edda", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "12px", color: "#155724", textAlign: "center" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>✓ Payment Confirmed</div>
                  <div style={{ fontSize: "11px" }}>
                    Confirmed by {selectedOrder.payment_confirmed_by} on {new Date(selectedOrder.payment_confirmed_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                  <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Payment Information</Text>
                  
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #e0e0e0" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Payment Amount:</span>
                      <span style={{ fontSize: "15px", fontWeight: "700", color: "#28a745" }}>PKR {Number(selectedOrder.payment_amount || 0).toFixed(2)}</span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Payment Method:</span>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>{selectedOrder.payment_method?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Confirmed By:</span>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>{selectedOrder.payment_confirmed_by}</span>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Confirmed On:</span>
                      <span style={{ fontSize: "13px", fontWeight: "600" }}>{new Date(selectedOrder.payment_confirmed_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedOrder.payment_screenshot && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
                      <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Payment Screenshot/Receipt</Text>
                      <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                        <img 
                          src={selectedOrder.payment_screenshot} 
                          alt="Payment screenshot" 
                          style={{ maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto", borderRadius: "4px" }} 
                        />
                      </div>
                    </div>
                  )}

                  {selectedOrder.payment_notes && (
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #e0e0e0" }}>
                      <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Payment Notes</Text>
                      <div style={{ backgroundColor: "white", padding: "12px", borderRadius: "4px", border: "1px solid #e0e0e0", fontSize: "13px", color: "#333" }}>
                        {selectedOrder.payment_notes}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: "#fff3cd", padding: "12px", borderRadius: "6px", fontSize: "12px", color: "#856404" }}>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>📦 Ready for Inventory</div>
                  <div>This order has been confirmed and is ready to be processed by the inventory team.</div>
                </div>
              </Tabs.Panel>
            </Tabs>
          </div>
        )}
      </Modal>
    </div>
  );
}

const downloadInvoicePDF = async (invoice: any) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const right = pageWidth - margin;
  const contentWidth = pageWidth - margin * 2;

  // ── Load logo ──
  const loadLogo = (): Promise<{data: string, w: number, h: number}> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = img.width; c.height = img.height;
        c.getContext("2d")?.drawImage(img, 0, 0);
        resolve({ data: c.toDataURL("image/png", 1), w: img.width, h: img.height });
      };
      img.onerror = reject;
      img.src = "/images-removebg-preview.png";
    });

  let yPos = margin;

  // ── Logo + title header ──
  try {
    const logo = await loadLogo();
    const maxH = 30, maxW = 30;
    const scale = Math.min(maxW / logo.w, maxH / logo.h, 1);
    const lw = logo.w * scale, lh = logo.h * scale;
    doc.addImage(logo.data, "PNG", margin, yPos, lw, lh);
  } catch {
    doc.setFillColor(41, 128, 185);
    doc.roundedRect(margin, yPos, 30, 30, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("VOLTRIX", margin + 15, yPos + 13, { align: "center" });
    doc.text("ERP", margin + 15, yPos + 21, { align: "center" });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PURCHASE INVOICE", right, yPos + 10, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`${invoice.bomNumber}  |  ${new Date(invoice.createdAt).toLocaleDateString()}`, right, yPos + 19, { align: "right" });

  yPos += 38;

  // ── FROM / TO container ──
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPos, contentWidth, 28, 4, 4, "S");

  const col1 = margin + 10;
  const col2 = margin + contentWidth * 0.5 + 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text("FROM (SUPPLIER)", col1, yPos + 8);
  doc.text("TO (COMPANY)", col2, yPos + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.supplierName || "N/A", col1, yPos + 16);
  doc.text("Internal Purchase", col2, yPos + 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Delivery: ${new Date(invoice.deliveryDate).toLocaleDateString()}  ·  By: ${invoice.createdBy}  ·  Status: ${invoice.status.toUpperCase()}`, col1, yPos + 23);

  yPos += 36;

  // ── Items table ──
  const items = invoice.bomData?.items || [];
  const itemRates = invoice.bestQuote?.itemRates || {};
  const rows = items.map((item: any) => {
    const rate = itemRates[item.itemName] || itemRates[item.id] || {};
    const unitPrice = rate.unitPrice || 0;
    return [item.itemName, item.itemType || "—", item.quantity, item.unit, `PKR ${unitPrice.toLocaleString()}`, `PKR ${(unitPrice * item.quantity).toLocaleString()}`];
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Item Name", "Type", "Qty", "Unit", "Unit Price", "Total"]],
    body: rows,
    styles: { fontSize: 8, fontStyle: "normal", cellPadding: 5 },
    headStyles: { fillColor: [17, 17, 17], textColor: 255, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { fontStyle: "bold" },
      4: { halign: "right" },
      5: { halign: "right", fontStyle: "bold" }
    },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.3,
    margin: { left: margin, right: margin },
  });

  // ── Totals ──
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const transport = invoice.bestQuote?.transportCost || 0;
  const tax = invoice.bestQuote?.tax || 0;
  const subtotal = invoice.totalAmount - transport - tax;

  // Totals container
  const totalsX = margin + contentWidth * 0.55;
  const totalsW = contentWidth * 0.45;
  let tY = finalY;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.roundedRect(totalsX, tY, totalsW, (transport > 0 ? 8 : 0) + (tax > 0 ? 8 : 0) + 24, 4, 4, "S");

  tY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Subtotal:", totalsX + 8, tY);
  doc.text(`PKR ${subtotal.toLocaleString()}`, totalsX + totalsW - 8, tY, { align: "right" });

  if (transport > 0) {
    tY += 8;
    doc.text("Transport:", totalsX + 8, tY);
    doc.text(`PKR ${transport.toLocaleString()}`, totalsX + totalsW - 8, tY, { align: "right" });
  }
  if (tax > 0) {
    tY += 8;
    doc.text("Tax:", totalsX + 8, tY);
    doc.text(`PKR ${tax.toLocaleString()}`, totalsX + totalsW - 8, tY, { align: "right" });
  }

  tY += 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(totalsX + 6, tY - 3, totalsX + totalsW - 6, tY - 3);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL:", totalsX + 8, tY + 4);
  doc.text(`PKR ${invoice.totalAmount.toLocaleString()}`, totalsX + totalsW - 8, tY + 4, { align: "right" });

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text("This is a system-generated invoice by Voltrix ERP", pageWidth / 2, footerY, { align: "center" });

  doc.save(`Invoice-${invoice.bomNumber}.pdf`);
};

const downloadOrderDetailsPDF = async (order: any) => {
  const { default: jsPDF } = await import("jspdf");
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to load logo image
  const loadLogoImage = (): Promise<{data: string, width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = canvas.toDataURL('image/png', 1.0);
        resolve({
          data: imageData,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => reject(new Error('Failed to load logo'));
      // Use the correct path for your logo
      img.src = '/images-removebg-preview.png';
    });
  };
  const loadImageAsBase64 = (url: string): Promise<{data: string, width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      // If already a base64 data URL, load it directly
      if (url.startsWith('data:')) {
        const img = new Image();
        img.onload = function() {
          resolve({ data: url, width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error('Failed to load base64 image'));
        img.src = url;
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.95);
        resolve({
          data: imageData,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  // Helper function to load paid stamp image
  const loadPaidImage = (): Promise<{data: string, width: number, height: number}> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = canvas.toDataURL('image/png', 1.0);
        resolve({
          data: imageData,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => {
        console.error('Failed to load paid image from /paid imaeg.png');
        reject(new Error('Failed to load paid image'));
      };
      // Use the correct path for the paid stamp image
      img.src = '/paidimaeg.png';
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPACT HEADER WITH LOGO ONLY
  // ═══════════════════════════════════════════════════════════════
  
  let yPos = margin;

  // Load and display the actual logo
  try {
    const logoInfo = await loadLogoImage();
    
    // Calculate logo dimensions (smaller for compact design)
    const maxLogoHeight = 35;
    const maxLogoWidth = 35;
    
    let logoWidth = logoInfo.width;
    let logoHeight = logoInfo.height;
    
    const widthRatio = maxLogoWidth / logoWidth;
    const heightRatio = maxLogoHeight / logoHeight;
    const logoScale = Math.min(widthRatio, heightRatio, 1);
    
    logoWidth = logoWidth * logoScale;
    logoHeight = logoHeight * logoScale;
    
    // Add the actual logo
    doc.addImage(logoInfo.data, 'PNG', margin, yPos, logoWidth, logoHeight);
    
  } catch (error) {
    // Compact fallback if logo fails to load
    console.error('Logo loading failed:', error);
    doc.setFillColor(41, 128, 185);
    doc.roundedRect(margin, yPos, 35, 35, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("VOLTRIX", margin + 17.5, yPos + 15, { align: "center" });
    doc.text("ERP", margin + 17.5, yPos + 25, { align: "center" });
  }

  // Document title and info on the right - compact with small fonts
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("ORDER RECEIPT", pageWidth - margin, yPos + 12, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Order #${order.id.slice(0, 8).toUpperCase()} | ${new Date().toLocaleDateString()}`, pageWidth - margin, yPos + 20, { align: "right" });

  yPos += 35;

  // ═══════════════════════════════════════════════════════════════
  // SINGLE COMPACT CONTAINER WITH ALL INFORMATION
  // ═══════════════════════════════════════════════════════════════
  
  const containerWidth = contentWidth;
  const containerHeight = 65;
  
  // Draw single container with black border, no background, rounded corners
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.roundedRect(margin, yPos, containerWidth, containerHeight, 6, 6, "S");
  
  // Define column positions within the container
  const col1X = margin + 12;
  const col2X = margin + containerWidth * 0.35;
  const col3X = margin + containerWidth * 0.65;
  
  let contentY = yPos + 10;
  
  // PRODUCT INFORMATION (Left section)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(52, 58, 64);
  doc.text("PRODUCT INFORMATION", col1X, contentY);
  
  contentY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const productLines = doc.splitTextToSize(order.product_name, containerWidth * 0.3);
  productLines.forEach((line: string) => {
    doc.text(line, col1X, contentY);
    contentY += 5;
  });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(108, 117, 125);
  doc.text(`Quantity: ${order.quantity} ${order.unit}`, col1X, contentY + 2);

  // CLIENT (Middle section)
  let clientY = yPos + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(52, 58, 64);
  doc.text("CLIENT", col2X, clientY);
  
  clientY += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(order.client_name, col2X, clientY);

  // AMOUNT BREAKDOWN (Right section)
  let amountY = yPos + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(52, 58, 64);
  doc.text("AMOUNT BREAKDOWN", col3X, amountY);
  
  amountY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);

  // Amount details in compact format
  const amountDetails = [
    { label: "Unit Price", value: `PKR ${Number(order.unit_price || 0).toLocaleString()}` },
    { label: "Quantity", value: `${order.quantity} ${order.unit}` }
  ];

  if (order.tax > 0) amountDetails.push({ label: "Tax", value: `PKR ${Number(order.tax).toLocaleString()}` });
  if (order.transport > 0) amountDetails.push({ label: "Transport", value: `PKR ${Number(order.transport).toLocaleString()}` });

  amountDetails.forEach(detail => {
    doc.text(detail.label + ":", col3X, amountY);
    doc.text(detail.value, margin + containerWidth - 12, amountY, { align: "right" });
    amountY += 5;
  });

  // Total Amount in smaller font
  amountY += 2;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(col3X, amountY, margin + containerWidth - 12, amountY);
  amountY += 6;
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL AMOUNT:", col3X, amountY);
  doc.setTextColor(40, 167, 69);
  doc.text(`PKR ${Number(order.total_price || 0).toLocaleString()}`, margin + containerWidth - 12, amountY, { align: "right" });

  yPos += containerHeight + 12;

  // ═══════════════════════════════════════════════════════════════
  // PAYMENT SCREENSHOT AND PAID STAMP SIDE BY SIDE
  // ═══════════════════════════════════════════════════════════════
  
  if (order.payment_screenshot) {
    try {
      // Load both images independently so one failure doesn't block the other
      const [imageResult, paidResult] = await Promise.allSettled([
        loadImageAsBase64(order.payment_screenshot),
        loadPaidImage()
      ]);
      
      const imageInfo = imageResult.status === 'fulfilled' ? imageResult.value : null;
      const paidImageInfo = paidResult.status === 'fulfilled' ? paidResult.value : null;

      if (paidResult.status === 'rejected') console.error('Paid image failed:', paidResult.reason);
      if (imageResult.status === 'rejected') console.error('Payment screenshot failed:', imageResult.reason);
      
      if (imageInfo) {
        // Calculate image dimensions for left side
        const maxImageWidth = contentWidth * 0.65;
        const maxImageHeight = 140;
        
        let displayWidth = imageInfo.width;
        let displayHeight = imageInfo.height;
        
        const widthRatio = maxImageWidth / displayWidth;
        const heightRatio = maxImageHeight / displayHeight;
        const scale = Math.min(widthRatio, heightRatio, 1);
        
        displayWidth = displayWidth * scale;
        displayHeight = displayHeight * scale;
        
        // Border around payment screenshot
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(2);
        doc.rect(margin - 3, yPos - 3, displayWidth + 6, displayHeight + 6);
        doc.setFillColor(255, 255, 255);
        doc.rect(margin - 2, yPos - 2, displayWidth + 4, displayHeight + 4, "F");
        
        doc.addImage(imageInfo.data, 'JPEG', margin, yPos, displayWidth, displayHeight);
        
        // PAID stamp on the right
        if (paidImageInfo) {
          const stampX = margin + maxImageWidth + 5;
          const stampY = yPos + (displayHeight / 2) - 40;
          
          const maxStampSize = 80;
          let stampWidth = paidImageInfo.width;
          let stampHeight = paidImageInfo.height;
          const stampScale = Math.min(maxStampSize / stampWidth, maxStampSize / stampHeight, 1);
          stampWidth = stampWidth * stampScale;
          stampHeight = stampHeight * stampScale;
          
          doc.addImage(paidImageInfo.data, 'PNG', stampX, stampY, stampWidth, stampHeight);
        }
        
        yPos += Math.max(displayHeight, 80) + 20;
      }
      
    } catch (error) {
      console.error("Error in payment section:", error);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FOOTER - removed as requested
  // ═══════════════════════════════════════════════════════════════

  // Save the PDF
  doc.save(`Receipt-${order.client_name}-${order.id.slice(0, 8)}.pdf`);
};

function FinanceOverview() {
  const [showIncomingDetails, setShowIncomingDetails] = useState(false);
  const [showOutgoingDetails, setShowOutgoingDetails] = useState(false);
  const [incomingMoney, setIncomingMoney] = useState<any[]>([]);
  const [outgoingMoney, setOutgoingMoney] = useState<any[]>([]);
  const [selectedIncomingOrder, setSelectedIncomingOrder] = useState<any>(null);
  const [showIncomingOrderModal, setShowIncomingOrderModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [totals, setTotals] = useState({ totalIncoming: 0, totalOutgoing: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [outgoingSearch, setOutgoingSearch] = useState("");
  const [outgoingFilterSupplier, setOutgoingFilterSupplier] = useState("all");
  const [selectedOutgoingInvoice, setSelectedOutgoingInvoice] = useState<any>(null);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      // Load incoming money (client orders with payments)
      const clientOrdersRes = await fetch("/api/crm/orders");
      const clientOrders = await clientOrdersRes.json();
      const paidOrders = clientOrders.filter((order: any) => 
        order.status === "payment_confirmed" || order.status === "fulfilled"
      );

      // Load outgoing money (approved BOM invoices)
      const bomInvoicesRes = await fetch("/api/finance/bom-invoices");
      const bomInvoices = await bomInvoicesRes.json();
      const approvedInvoices = bomInvoices.filter((inv: any) => inv.status === 'approved');
      
      setIncomingMoney(paidOrders);
      setOutgoingMoney(approvedInvoices);
      
      // Calculate totals
      const totalIncoming = paidOrders.reduce((sum: number, order: any) => 
        sum + (Number(order.payment_amount) || Number(order.total_price) || 0), 0
      );
      
      const totalOutgoing = approvedInvoices.reduce((sum: number, invoice: any) => 
        sum + (Number(invoice.totalAmount) || 0), 0
      );
      
      setTotals({
        totalIncoming,
        totalOutgoing
      });
      
    } catch (error) {
      console.error("Error loading finance data:", error);
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showIncomingDetails) {
    const filtered = incomingMoney.filter((order) => {
      const matchSearch = !searchQuery ||
        order.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMethod = filterMethod === "all" || (order.payment_method || "").toLowerCase() === filterMethod;
      const matchStatus = filterStatus === "all" || order.status === filterStatus;
      return matchSearch && matchMethod && matchStatus;
    });

    return (
      <div style={{ fontFamily: "Poppins, sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", gap: "12px" }}>
          <button
            onClick={() => setShowIncomingDetails(false)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", fontSize: "18px", color: "#333" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>Incoming Money</div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search client or product..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "Poppins, sans-serif" }}
            />
          </div>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}
            style={{ padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "white", fontFamily: "Poppins, sans-serif", color: "#333", cursor: "pointer" }}>
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cheque">Cheque</option>
            <option value="online">Online</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "white", fontFamily: "Poppins, sans-serif", color: "#333", cursor: "pointer" }}>
            <option value="all">All Statuses</option>
            <option value="payment_confirmed">Payment Confirmed</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
          {(searchQuery || filterMethod !== "all" || filterStatus !== "all") && (
            <button onClick={() => { setSearchQuery(""); setFilterMethod("all"); setFilterStatus("all"); }}
              style={{ padding: "9px 14px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "12px", background: "white", cursor: "pointer", color: "#666", fontFamily: "Poppins, sans-serif" }}>
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa", fontSize: "14px" }}>No records found.</div>
        ) : (
          <div style={{ border: "1px solid #e8e8e8", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Poppins, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
                  {["Client", "Product", "Order Amount", "Payment Amount", "Method", "Date Received", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => (
                  <tr key={order.id || idx}
                    style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}
                    onClick={() => { setSelectedIncomingOrder(order); setShowIncomingOrderModal(true); }}
                  >
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: "#111" }}>{order.client_name}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#444", maxWidth: "180px" }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.product_name}</div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: "#111" }}>PKR {Number(order.total_price || 0).toLocaleString()}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>PKR {Number(order.payment_amount || order.total_price || 0).toLocaleString()}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "4px", background: "#f0f0f0", color: "#555" }}>
                        {order.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#666" }}>
                      {order.payment_confirmed_at ? new Date(order.payment_confirmed_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: order.status === "fulfilled" ? "#dbeafe" : "#dcfce7", color: order.status === "fulfilled" ? "#1d4ed8" : "#15803d" }}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#aaa", fontSize: "12px" }}>→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Incoming Order Detail Modal */}
        <Modal 
          opened={showIncomingOrderModal} 
          onClose={() => setShowIncomingOrderModal(false)} 
          title="" 
          size="xl" 
          styles={{ 
            header: { display: "none" }, 
            body: { padding: 0 },
            content: { maxWidth: "95vw", width: "1400px" }
          }}
        >
          {selectedIncomingOrder && (
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              {/* Header */}
              <div style={{ backgroundColor: "#111", padding: "24px 32px", position: "relative" }}>
                <button 
                  onClick={() => setShowIncomingOrderModal(false)} 
                  style={{ 
                    position: "absolute", 
                    top: "16px", 
                    right: "16px", 
                    background: "rgba(255,255,255,0.1)", 
                    border: "none", 
                    color: "white", 
                    borderRadius: "50%", 
                    width: "28px", 
                    height: "28px", 
                    cursor: "pointer", 
                    fontSize: "16px" 
                  }}
                >
                  ×
                </button>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                  Order Details
                </Text>
                <Text style={{ color: "white", fontSize: "24px", fontWeight: "700" }}>
                  {selectedIncomingOrder.product_name}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px", marginTop: "6px" }}>
                  {selectedIncomingOrder.quantity} {selectedIncomingOrder.unit}
                </Text>
              </div>

              {/* Status and Date Bar */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ padding: "20px 24px", borderRight: "1px solid #f0f0f0" }}>
                  <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Status
                  </Text>
                  <Badge color={selectedIncomingOrder.status === "fulfilled" ? "blue" : "green"} size="lg">
                    {selectedIncomingOrder.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div style={{ padding: "20px 24px", borderRight: "1px solid #f0f0f0" }}>
                  <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Order Date
                  </Text>
                  <Text style={{ fontSize: "16px", fontWeight: "600" }}>
                    {new Date(selectedIncomingOrder.created_at).toLocaleDateString()}
                  </Text>
                </div>
                <div style={{ padding: "20px 24px" }}>
                  <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                    Client
                  </Text>
                  <Text style={{ fontSize: "16px", fontWeight: "600" }}>
                    {selectedIncomingOrder.client_name}
                  </Text>
                </div>
              </div>

              {/* Two Column Layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", minHeight: "350px" }}>
                
                {/* Left Column - Order & Amount Details */}
                <div style={{ padding: "28px 32px", borderRight: "1px solid #f0f0f0" }}>
                  <Text style={{ fontSize: "15px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "18px", fontWeight: "600" }}>
                    Order Amount Breakdown
                  </Text>
                  
                  <div style={{ backgroundColor: "#f8f9fa", padding: "24px", borderRadius: "10px", marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                      <Text style={{ fontSize: "16px", color: "#555" }}>Unit Price:</Text>
                      <Text style={{ fontSize: "16px", fontWeight: "600" }}>PKR {Number(selectedIncomingOrder.unit_price || 0).toLocaleString()}</Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                      <Text style={{ fontSize: "16px", color: "#555" }}>Quantity:</Text>
                      <Text style={{ fontSize: "16px", fontWeight: "600" }}>{selectedIncomingOrder.quantity} {selectedIncomingOrder.unit}</Text>
                    </div>
                    {selectedIncomingOrder.tax > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <Text style={{ fontSize: "16px", color: "#555" }}>Tax:</Text>
                        <Text style={{ fontSize: "16px", fontWeight: "600" }}>PKR {Number(selectedIncomingOrder.tax || 0).toLocaleString()}</Text>
                      </div>
                    )}
                    {selectedIncomingOrder.transport > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <Text style={{ fontSize: "16px", color: "#555" }}>Transport:</Text>
                        <Text style={{ fontSize: "16px", fontWeight: "600" }}>PKR {Number(selectedIncomingOrder.transport || 0).toLocaleString()}</Text>
                      </div>
                    )}
                    {selectedIncomingOrder.other_charges > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <Text style={{ fontSize: "16px", color: "#555" }}>Other Charges:</Text>
                        <Text style={{ fontSize: "16px", fontWeight: "600" }}>PKR {Number(selectedIncomingOrder.other_charges || 0).toLocaleString()}</Text>
                      </div>
                    )}
                    <div style={{ borderTop: "2px solid #333", paddingTop: "14px", marginTop: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text style={{ fontSize: "20px", fontWeight: "700", color: "#111" }}>Total Amount:</Text>
                        <Text style={{ fontSize: "20px", fontWeight: "700", color: "#28a745" }}>PKR {Number(selectedIncomingOrder.total_price || 0).toLocaleString()}</Text>
                      </div>
                    </div>
                  </div>

                  {/* Order Notes */}
                  {selectedIncomingOrder.notes && (
                    <div>
                      <Text style={{ fontSize: "15px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "14px", fontWeight: "600" }}>
                        Order Notes
                      </Text>
                      <div style={{ backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "10px" }}>
                        <Text style={{ fontSize: "16px", color: "#555", lineHeight: "1.6" }}>
                          {selectedIncomingOrder.notes}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Payment Details */}
                <div style={{ padding: "28px 32px" }}>
                  <Text style={{ fontSize: "15px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "18px", fontWeight: "600" }}>
                    Payment Information
                  </Text>
                  
                  {selectedIncomingOrder.payment_confirmed_at ? (
                    <>
                      {/* Payment confirmed - show full details */}
                      <div style={{ backgroundColor: "#d4edda", padding: "22px", borderRadius: "10px", marginBottom: "26px", fontSize: "16px", color: "#155724", textAlign: "center" }}>
                        <div style={{ fontWeight: "700", marginBottom: "10px", fontSize: "18px" }}>✓ Payment Confirmed</div>
                        <div style={{ fontSize: "14px" }}>
                          Confirmed by {selectedIncomingOrder.payment_confirmed_by} on {new Date(selectedIncomingOrder.payment_confirmed_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ backgroundColor: "#f8f9fa", padding: "22px", borderRadius: "10px", marginBottom: "26px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Payment Amount:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "700", color: "#28a745" }}>PKR {Number(selectedIncomingOrder.payment_amount || selectedIncomingOrder.total_price || 0).toLocaleString()}</Text>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Payment Method:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "600" }}>{selectedIncomingOrder.payment_method?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Payment Date:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "600" }}>
                            {new Date(selectedIncomingOrder.payment_confirmed_at).toLocaleDateString()}
                          </Text>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Confirmed By:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "600" }}>{selectedIncomingOrder.payment_confirmed_by}</Text>
                        </div>
                      </div>

                      {/* Payment Screenshot */}
                      {selectedIncomingOrder.payment_screenshot && (
                        <div style={{ marginBottom: "22px" }}>
                          <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "14px" }}>Payment Screenshot/Receipt</Text>
                          <div style={{ backgroundColor: "white", padding: "14px", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
                            <img 
                              src={selectedIncomingOrder.payment_screenshot} 
                              alt="Payment screenshot" 
                              style={{ 
                                maxWidth: "100%", 
                                maxHeight: "180px", 
                                display: "block", 
                                margin: "0 auto", 
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "transform 0.2s"
                              }} 
                              onClick={() => {
                                setSelectedImage(selectedIncomingOrder.payment_screenshot);
                                setShowImageModal(true);
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
                              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                            />
                            <Text style={{ fontSize: "13px", color: "#666", textAlign: "center", marginTop: "10px" }}>
                              Click to view full size and download
                            </Text>
                          </div>
                          <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#e8f5e9", borderRadius: "8px", border: "1px solid #c3e6cb" }}>
                            <Text style={{ fontSize: "13px", color: "#2e7d32", textAlign: "center", fontStyle: "italic" }}>
                              ✅ Payment screenshot is included when downloading PDF export.
                            </Text>
                          </div>
                        </div>
                      )}

                      {/* Payment Notes */}
                      {selectedIncomingOrder.payment_notes && (
                        <div>
                          <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "14px" }}>Payment Notes</Text>
                          <div style={{ backgroundColor: "#f8f9fa", padding: "18px", borderRadius: "10px", fontSize: "16px", color: "#333" }}>
                            {selectedIncomingOrder.payment_notes}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Payment not confirmed - show pending status */}
                      <div style={{ backgroundColor: "#fff3cd", padding: "22px", borderRadius: "10px", marginBottom: "26px", fontSize: "16px", color: "#856404", textAlign: "center" }}>
                        <div style={{ fontWeight: "700", marginBottom: "10px", fontSize: "18px" }}>⏳ Payment Pending</div>
                        <div style={{ fontSize: "14px" }}>
                          Payment has not been confirmed yet
                        </div>
                      </div>

                      <div style={{ backgroundColor: "#f8f9fa", padding: "22px", borderRadius: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Expected Amount:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "600" }}>PKR {Number(selectedIncomingOrder.total_price || 0).toLocaleString()}</Text>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Payment Status:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "600", color: "#856404" }}>Awaiting Payment</Text>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: "16px", color: "#555" }}>Order Status:</Text>
                          <Text style={{ fontSize: "16px", fontWeight: "600" }}>{selectedIncomingOrder.status.replace('_', ' ').toUpperCase()}</Text>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Download Button Footer */}
              <div style={{ padding: "24px 32px", borderTop: "1px solid #f0f0f0", backgroundColor: "#f8f9fa" }}>
                <Button 
                  onClick={() => downloadOrderDetailsPDF(selectedIncomingOrder)}
                  fullWidth
                  style={{ 
                    backgroundColor: "#6f42c1", 
                    color: "#fff", 
                    padding: "16px 24px",
                    fontSize: "16px",
                    fontWeight: "600",
                    height: "auto",
                    minHeight: "50px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  📄 Download Order Details PDF
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Image Viewer Modal */}
        <Modal 
          opened={showImageModal} 
          onClose={() => setShowImageModal(false)} 
          title="" 
          size="xl" 
          styles={{ header: { display: "none" }, body: { padding: 0 } }}
        >
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ backgroundColor: "#111", padding: "20px 24px", position: "relative" }}>
              <button 
                onClick={() => setShowImageModal(false)} 
                style={{ 
                  position: "absolute", 
                  top: "14px", 
                  right: "14px", 
                  background: "rgba(255,255,255,0.1)", 
                  border: "none", 
                  color: "white", 
                  borderRadius: "50%", 
                  width: "26px", 
                  height: "26px", 
                  cursor: "pointer", 
                  fontSize: "15px" 
                }}
              >
                ×
              </button>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                Payment Screenshot
              </Text>
              <Text style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>
                Payment Receipt
              </Text>
            </div>
            
            <div style={{ padding: "20px", textAlign: "center" }}>
              <img 
                src={selectedImage} 
                alt="Payment screenshot full size" 
                style={{ 
                  maxWidth: "100%", 
                  maxHeight: "70vh", 
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }} 
              />
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "12px", justifyContent: "center" }}>
              <Button 
                onClick={() => downloadImage(selectedImage, `Payment-Screenshot-${selectedIncomingOrder?.client_name || 'Client'}-${Date.now()}.jpg`)}
                style={{ 
                  backgroundColor: "#28a745", 
                  color: "#fff", 
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                📥 Download Image
              </Button>
              <Button 
                onClick={() => setShowImageModal(false)}
                variant="outline"
                style={{ 
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "600"
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (showOutgoingDetails) {
    const filteredOutgoing = outgoingMoney.filter((invoice) => {
      const matchSearch = !outgoingSearch ||
        invoice.bomNumber?.toLowerCase().includes(outgoingSearch.toLowerCase()) ||
        invoice.supplierName?.toLowerCase().includes(outgoingSearch.toLowerCase());
      const matchSupplier = outgoingFilterSupplier === "all" ||
        invoice.supplierName === outgoingFilterSupplier;
      return matchSearch && matchSupplier;
    });

    const uniqueSuppliers = [...new Set(outgoingMoney.map((i: any) => i.supplierName).filter(Boolean))];

    return (
      <div style={{ fontFamily: "Poppins, sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", gap: "12px" }}>
          <button
            onClick={() => setShowOutgoingDetails(false)}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", fontSize: "18px", color: "#333" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f0f0f0")}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            ←
          </button>
          <div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#111" }}>Outgoing Money</div>
            <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>{filteredOutgoing.length} record{filteredOutgoing.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* Search + Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px" }}>🔍</span>
            <input
              type="text"
              placeholder="Search PO number or supplier..."
              value={outgoingSearch}
              onChange={e => setOutgoingSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "Poppins, sans-serif" }}
            />
          </div>
          <select value={outgoingFilterSupplier} onChange={e => setOutgoingFilterSupplier(e.target.value)}
            style={{ padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "white", fontFamily: "Poppins, sans-serif", color: "#333", cursor: "pointer" }}>
            <option value="all">All Suppliers</option>
            {uniqueSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(outgoingSearch || outgoingFilterSupplier !== "all") && (
            <button onClick={() => { setOutgoingSearch(""); setOutgoingFilterSupplier("all"); }}
              style={{ padding: "9px 14px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "12px", background: "white", cursor: "pointer", color: "#666", fontFamily: "Poppins, sans-serif" }}>
              Clear
            </button>
          )}
        </div>

        {/* Table */}
        {filteredOutgoing.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa", fontSize: "14px" }}>No records found.</div>
        ) : (
          <div style={{ border: "1px solid #e8e8e8", borderRadius: "12px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "Poppins, sans-serif" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
                  {["PO Number", "Supplier", "Amount", "Delivery Date", "Status", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOutgoing.map((invoice, idx) => (
                  <tr key={invoice.id || idx}
                    style={{ borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}
                    onClick={() => { setSelectedOutgoingInvoice(invoice); setShowOutgoingModal(true); }}
                  >
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "600", color: "#111" }}>{invoice.bomNumber}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", color: "#444" }}>{invoice.supplierName}</td>
                    <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: "700", color: "#dc2626" }}>
                      PKR {Number(invoice.totalAmount || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: "12px", color: "#666" }}>
                      {invoice.deliveryDate ? new Date(invoice.deliveryDate).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: "#dcfce7", color: "#15803d" }}>
                        APPROVED
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#aaa", fontSize: "12px" }}>→</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Outgoing Invoice Detail Modal */}
        {showOutgoingModal && selectedOutgoingInvoice && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ backgroundColor: "white", borderRadius: "12px", width: "420px", maxHeight: "90vh", overflowY: "auto", fontFamily: "Poppins, sans-serif", flexShrink: 0 }}>
              {/* Header */}
              <div style={{ backgroundColor: "#111", padding: "24px 28px", borderRadius: "12px 12px 0 0", position: "relative" }}>
                <button onClick={() => setShowOutgoingModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px" }}>×</button>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Purchase Order</div>
                <div style={{ color: "white", fontSize: "22px", fontWeight: "700" }}>{selectedOutgoingInvoice.bomNumber}</div>
                <div style={{ color: "#4ade80", fontSize: "20px", fontWeight: "700", marginTop: "4px" }}>PKR {Number(selectedOutgoingInvoice.totalAmount || 0).toLocaleString()}</div>
              </div>

              {/* Info bar */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
                {[
                  { label: "Supplier", value: selectedOutgoingInvoice.supplierName },
                  { label: "Delivery Date", value: selectedOutgoingInvoice.deliveryDate ? new Date(selectedOutgoingInvoice.deliveryDate).toLocaleDateString() : "—" },
                  { label: "Created", value: selectedOutgoingInvoice.createdAt ? new Date(selectedOutgoingInvoice.createdAt).toLocaleDateString() : "—" },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ padding: "16px 20px", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Items */}
              <div style={{ padding: "20px 28px" }}>
                <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#333" }}>Items</div>
                <div style={{ border: "1px solid #e8e8e8", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
                        {["Item", "Qty", "Unit", "Unit Price", "Total"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#888", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOutgoingInvoice.bomData?.items || []).map((item: any, i: number) => {
                        const rate = selectedOutgoingInvoice.bestQuote?.itemRates?.[item.itemName] || selectedOutgoingInvoice.bestQuote?.itemRates?.[item.id];
                        const unitPrice = rate?.unitPrice || 0;
                        return (
                          <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: "600" }}>{item.itemName}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px" }}>{item.quantity}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", color: "#666" }}>{item.unit}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px" }}>PKR {unitPrice.toLocaleString()}</td>
                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: "600", color: "#28a745" }}>PKR {(unitPrice * item.quantity).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  {(selectedOutgoingInvoice.bestQuote?.transportCost || 0) > 0 && (
                    <div style={{ display: "flex", gap: "60px", fontSize: "13px", color: "#666" }}>
                      <span>Transport</span><span>PKR {Number(selectedOutgoingInvoice.bestQuote.transportCost).toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedOutgoingInvoice.bestQuote?.tax || 0) > 0 && (
                    <div style={{ display: "flex", gap: "60px", fontSize: "13px", color: "#666" }}>
                      <span>Tax</span><span>PKR {Number(selectedOutgoingInvoice.bestQuote.tax).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "60px", fontSize: "16px", fontWeight: "700", borderTop: "1px solid #e0e0e0", paddingTop: "10px", marginTop: "4px" }}>
                    <span>Total</span><span style={{ color: "#dc2626" }}>PKR {Number(selectedOutgoingInvoice.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => downloadInvoicePDF(selectedOutgoingInvoice)}
                  style={{ flex: 1, padding: "12px", backgroundColor: "#6f42c1", color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "Poppins, sans-serif" }}
                >
                  📄 Download PDF
                </button>
                <button
                  onClick={() => setShowOutgoingModal(false)}
                  style={{ padding: "12px 20px", backgroundColor: "white", color: "#666", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "14px", cursor: "pointer", fontFamily: "Poppins, sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Poppins, sans-serif", padding: "40px 0" }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        gap: "40px"
      }}>
        <div 
          style={{ 
            cursor: "pointer",
            textAlign: "center"
          }}
          onClick={() => setShowIncomingDetails(true)}
        >
          <Text style={{ fontSize: "16px", color: "#000", marginBottom: "5px" }}>
            Incoming Money
          </Text>
          <Text style={{ fontSize: "18px", color: "#000", fontWeight: "600" }}>
            PKR {totals.totalIncoming.toLocaleString()}
          </Text>
        </div>
        
        <div style={{ 
          width: "1px", 
          height: "50px", 
          backgroundColor: "#ccc"
        }}></div>
        
        <div 
          style={{ 
            cursor: "pointer",
            textAlign: "center"
          }}
          onClick={() => setShowOutgoingDetails(true)}
        >
          <Text style={{ fontSize: "16px", color: "#000", marginBottom: "5px" }}>
            Outgoing Money
          </Text>
          <Text style={{ fontSize: "18px", color: "#000", fontWeight: "600" }}>
            PKR {totals.totalOutgoing.toLocaleString()}
          </Text>
        </div>
      </div>
    </div>
  );
}

interface BOMInvoice {
  id: string;
  bomId: string;
  bomNumber: string;
  bomData: any;
  bestQuote: any;
  status: 'pending' | 'approved';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  totalAmount: number;
  supplierName: string;
  deliveryDate: string;
  payment_method?: string;
  payment_amount?: number;
  payment_screenshot?: string;
  payment_notes?: string;
  approved_by?: string;
}

export default function Finance() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [bomInvoices, setBomInvoices] = useState<BOMInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<BOMInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceApprovedToast, setInvoiceApprovedToast] = useState(false);
  const [showApprovePaymentModal, setShowApprovePaymentModal] = useState(false);
  const [approvePayment, setApprovePayment] = useState({ method: "", amount: 0, screenshot: "", notes: "" });
  const [invoiceModalTab, setInvoiceModalTab] = useState<string | null>("details");

  useEffect(() => {
    fetchNotifications();
    fetchBOMInvoices();
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

  const fetchBOMInvoices = async () => {
    try {
      const res = await fetch("/api/finance/bom-invoices");
      const data = await res.json();
      setBomInvoices(data);
    } catch (error) {
      console.error("Error fetching BOM invoices:", error);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: 'pending' | 'approved', payment?: { method: string, amount: number, screenshot: string, notes: string }) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/finance/bom-invoices", {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: invoiceId, 
          status,
          ...(payment && {
            paymentMethod: payment.method,
            paymentAmount: payment.amount,
            paymentScreenshot: payment.screenshot,
            paymentNotes: payment.notes,
            approvedBy: user.username,
          })
        }),
      });
      
      if (res.ok) {
        fetchBOMInvoices();
        setInvoiceApprovedToast(true);
        setTimeout(() => setInvoiceApprovedToast(false), 3000);
      } else {
        alert('Failed to update invoice status');
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      alert('Error updating invoice status');
    }
  };

  const [bomSearch, setBomSearch] = useState("");
  const [bomFilterStatus, setBomFilterStatus] = useState("all");
  const [bomFilterSupplier, setBomFilterSupplier] = useState("all");

  const pendingInvoices = bomInvoices.filter(invoice => invoice.status === 'pending');
  const approvedInvoices = bomInvoices.filter(invoice => invoice.status === 'approved');

  const filterInvoices = (invoices: BOMInvoice[]) => invoices.filter(inv => {
    const q = bomSearch.toLowerCase();
    const matchSearch = !q ||
      inv.bomNumber?.toLowerCase().includes(q) ||
      inv.supplierName?.toLowerCase().includes(q) ||
      inv.createdBy?.toLowerCase().includes(q) ||
      inv.bomData?.items?.some((item: any) => item.itemName?.toLowerCase().includes(q));
    const matchStatus = bomFilterStatus === "all" || inv.status === bomFilterStatus;
    const matchSupplier = bomFilterSupplier === "all" || inv.supplierName === bomFilterSupplier;
    return matchSearch && matchStatus && matchSupplier;
  });

  const uniqueSupplierNames = [...new Set(bomInvoices.map(i => i.supplierName).filter(Boolean))];

  const renderInvoiceTable = (invoices: BOMInvoice[], showActions: boolean = false) => (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>BOM Number</Table.Th>
          <Table.Th>Supplier</Table.Th>
          <Table.Th>Total Amount</Table.Th>
          <Table.Th>Delivery Date</Table.Th>
          <Table.Th>Created By</Table.Th>
          <Table.Th>Date Created</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {invoices.map((invoice) => (
          <Table.Tr key={invoice.id} style={{ cursor: "pointer" }} onClick={() => { setSelectedInvoice(invoice); setShowInvoiceModal(true); }}>
            <Table.Td>
              <Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                {invoice.bomNumber}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                {invoice.supplierName}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text style={{ fontWeight: "600", color: "#28a745", fontFamily: "Poppins, sans-serif" }}>
                PKR {invoice.totalAmount.toLocaleString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                {new Date(invoice.deliveryDate).toLocaleDateString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                {invoice.createdBy}
              </Text>
            </Table.Td>
            <Table.Td>
              <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                {new Date(invoice.createdAt).toLocaleDateString()}
              </Text>
            </Table.Td>
            <Table.Td>
              <Badge color={invoice.status === 'pending' ? 'yellow' : 'green'}>
                {invoice.status}
              </Badge>
            </Table.Td>
            <Table.Td onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", gap: "8px" }}>
                <Button
                  size="xs"
                  onClick={() => { setSelectedInvoice(invoice); setShowInvoiceModal(true); }}
                  style={{ backgroundColor: "#007bff", fontFamily: "Poppins, sans-serif" }}
                >
                  View
                </Button>
                <Button
                  size="xs"
                  onClick={() => downloadInvoicePDF(invoice)}
                  style={{ backgroundColor: "#6f42c1", fontFamily: "Poppins, sans-serif" }}
                >
                  Download
                </Button>
                {showActions && invoice.status === 'pending' && (
                  <Button
                    size="xs"
                    onClick={() => { setSelectedInvoice(invoice); setApprovePayment({ method: "", amount: invoice.totalAmount, screenshot: "", notes: "" }); setShowApprovePaymentModal(true); }}
                    style={{ backgroundColor: "#28a745", fontFamily: "Poppins, sans-serif" }}
                  >
                    Approve
                  </Button>
                )}
              </div>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

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
            {/* Content */}
            <Box style={{ paddingTop: "20px" }}>
              <Text style={{ fontSize: "24px", fontWeight: "600", marginBottom: "20px", fontFamily: "Poppins, sans-serif" }}>
                Finance
              </Text>
              
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  <Tabs.Tab value="bom">Purchase Orders</Tabs.Tab>
                  <Tabs.Tab value="client-orders">Client Orders</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="md">
                  <FinanceOverview />
                </Tabs.Panel>

                <Tabs.Panel value="bom" pt="md">
                  {/* Search + Filters */}
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: "1", minWidth: "200px" }}>
                      <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px" }}>🔍</span>
                      <input
                        type="text"
                        placeholder="Search BOM number, supplier, item..."
                        value={bomSearch}
                        onChange={e => setBomSearch(e.target.value)}
                        style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "Poppins, sans-serif" }}
                      />
                    </div>
                    <select value={bomFilterSupplier} onChange={e => setBomFilterSupplier(e.target.value)}
                      style={{ padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "white", fontFamily: "Poppins, sans-serif", color: "#333", cursor: "pointer" }}>
                      <option value="all">All Suppliers</option>
                      {uniqueSupplierNames.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={bomFilterStatus} onChange={e => setBomFilterStatus(e.target.value)}
                      style={{ padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "white", fontFamily: "Poppins, sans-serif", color: "#333", cursor: "pointer" }}>
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                    </select>
                    {(bomSearch || bomFilterSupplier !== "all" || bomFilterStatus !== "all") && (
                      <button onClick={() => { setBomSearch(""); setBomFilterSupplier("all"); setBomFilterStatus("all"); }}
                        style={{ padding: "9px 14px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "12px", background: "white", cursor: "pointer", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                        Clear
                      </button>
                    )}
                  </div>

                  <Tabs defaultValue="pending">
                    <Tabs.List>
                      <Tabs.Tab value="pending">
                        Pending BOMs ({filterInvoices(pendingInvoices).length})
                      </Tabs.Tab>
                      <Tabs.Tab value="approved">
                        Approved BOMs ({filterInvoices(approvedInvoices).length})
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="pending" pt="md">
                      <div style={{ backgroundColor: "#fff", border: "1px solid #e9ecef", borderRadius: "8px", overflow: "hidden" }}>
                        {filterInvoices(pendingInvoices).length > 0 ? (
                          renderInvoiceTable(filterInvoices(pendingInvoices), true)
                        ) : (
                          <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>
                            No pending BOM invoices
                          </div>
                        )}
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel value="approved" pt="md">
                      <div style={{ backgroundColor: "#fff", border: "1px solid #e9ecef", borderRadius: "8px", overflow: "hidden" }}>
                        {filterInvoices(approvedInvoices).length > 0 ? (
                          renderInvoiceTable(filterInvoices(approvedInvoices), false)
                        ) : (
                          <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>
                            No approved BOM invoices
                          </div>
                        )}
                      </div>
                    </Tabs.Panel>
                  </Tabs>
                </Tabs.Panel>

                <Tabs.Panel value="client-orders" pt="md">
                  <ClientOrdersPanel />
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Box>
        </Box>
      </Box>
      
      {/* Invoice Detail Modal */}
      <Modal
        opened={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        title=""
        size="xl"
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        {selectedInvoice && (
          <div style={{ fontFamily: "Poppins, sans-serif", position: "relative" }}>

            {/* Dark header */}
            <div style={{ backgroundColor: "#111", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
              <div>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Purchase Order</Text>
                <Text style={{ color: "white", fontSize: "22px", fontWeight: "700" }}>{selectedInvoice.bomNumber}</Text>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>
                  Created by {selectedInvoice.createdBy} · {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </Text>
              </div>
              <div style={{ textAlign: "right" }}>
                <Text style={{ color: "#4ade80", fontSize: "26px", fontWeight: "700" }}>PKR {selectedInvoice.totalAmount.toLocaleString()}</Text>
                <Badge color={selectedInvoice.status === 'pending' ? 'yellow' : 'green'} style={{ marginTop: "6px" }}>{selectedInvoice.status}</Badge>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px" }}>×</button>
            </div>

            {/* Supplier + Delivery info */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
              {[
                { label: "Supplier", value: selectedInvoice.supplierName },
                { label: "Delivery Date", value: selectedInvoice.deliveryDate ? new Date(selectedInvoice.deliveryDate).toLocaleDateString() : "—" },
                { label: "Date Created", value: new Date(selectedInvoice.createdAt).toLocaleDateString() },
              ].map(({ label, value }, i) => (
                <div key={label} style={{ padding: "14px 20px", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                  <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</Text>
                  <Text style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{value}</Text>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <Tabs value={invoiceModalTab} onChange={(v) => setInvoiceModalTab(v)} style={{ padding: "0 28px" }}>
              <Tabs.List>
                <Tabs.Tab value="details" style={{ fontSize: "13px" }}>Order Details</Tabs.Tab>
                <Tabs.Tab value="payment" style={{ fontSize: "13px" }}>
                  Payment {selectedInvoice.payment_method ? "✓" : ""}
                </Tabs.Tab>
              </Tabs.List>

              {/* Details Tab */}
              <Tabs.Panel value="details" pt="md" pb="md">
                <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "10px", color: "#333" }}>Items</Text>
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Item Name</Table.Th><Table.Th>Type</Table.Th><Table.Th>Qty</Table.Th><Table.Th>Unit</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Unit Price</Table.Th>
                      <Table.Th style={{ textAlign: "right" }}>Total</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {selectedInvoice.bomData?.items?.map((item: any) => {
                      const rate = selectedInvoice.bestQuote?.itemRates?.[item.itemName] || selectedInvoice.bestQuote?.itemRates?.[item.id];
                      return (
                        <Table.Tr key={item.itemName}>
                          <Table.Td style={{ fontWeight: "600" }}>{item.itemName}</Table.Td>
                          <Table.Td style={{ color: "#666", fontSize: "12px" }}>{item.itemType}</Table.Td>
                          <Table.Td>{item.quantity}</Table.Td>
                          <Table.Td>{item.unit}</Table.Td>
                          <Table.Td style={{ textAlign: "right" }}>PKR {(rate?.unitPrice || 0).toLocaleString()}</Table.Td>
                          <Table.Td style={{ textAlign: "right", fontWeight: "600", color: "#28a745" }}>PKR {((rate?.unitPrice || 0) * item.quantity).toLocaleString()}</Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
                <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                    <Text>Subtotal</Text>
                    <Text>PKR {(selectedInvoice.totalAmount - (selectedInvoice.bestQuote?.transportCost || 0) - (selectedInvoice.bestQuote?.tax || 0)).toLocaleString()}</Text>
                  </div>
                  {(selectedInvoice.bestQuote?.transportCost || 0) > 0 && (
                    <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                      <Text>Transport</Text><Text>PKR {selectedInvoice.bestQuote.transportCost.toLocaleString()}</Text>
                    </div>
                  )}
                  {(selectedInvoice.bestQuote?.tax || 0) > 0 && (
                    <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                      <Text>Tax</Text><Text>PKR {selectedInvoice.bestQuote.tax.toLocaleString()}</Text>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "40px", fontSize: "16px", fontWeight: "700", borderTop: "1px solid #e0e0e0", paddingTop: "8px", marginTop: "4px" }}>
                    <Text>Total</Text>
                    <Text style={{ color: "#28a745" }}>PKR {selectedInvoice.totalAmount.toLocaleString()}</Text>
                  </div>
                </div>
              </Tabs.Panel>

              {/* Payment Tab */}
              <Tabs.Panel value="payment" pt="md" pb="md">
                {selectedInvoice.payment_method ? (
                  <div>
                    <div style={{ backgroundColor: "#d4edda", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px", color: "#155724" }}>
                      <div style={{ fontWeight: "600", marginBottom: "2px" }}>✓ Payment Confirmed</div>
                      {selectedInvoice.approved_by && <div style={{ fontSize: "11px" }}>Approved by {selectedInvoice.approved_by}</div>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                      {[
                        { label: "Payment Method", value: selectedInvoice.payment_method?.replace("_", " ").toUpperCase() },
                        { label: "Payment Amount", value: `PKR ${Number(selectedInvoice.payment_amount || 0).toLocaleString()}` },
                        { label: "Approved By", value: selectedInvoice.approved_by || "—" },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ backgroundColor: "#f8f9fa", padding: "14px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</div>
                          <div style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {selectedInvoice.payment_notes && (
                      <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "6px" }}>Notes</div>
                        <div style={{ backgroundColor: "#f8f9fa", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "#444" }}>{selectedInvoice.payment_notes}</div>
                      </div>
                    )}
                    {selectedInvoice.payment_screenshot && (
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>Payment Proof / Screenshot</div>
                        <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fafafa", padding: "8px" }}>
                          <img src={selectedInvoice.payment_screenshot} alt="Payment proof"
                            style={{ maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto", borderRadius: "4px", cursor: "pointer" }}
                            onClick={() => window.open(selectedInvoice.payment_screenshot, "_blank")} />
                          <div style={{ textAlign: "center", marginTop: "8px" }}>
                            <button onClick={() => { const a = document.createElement("a"); a.href = selectedInvoice.payment_screenshot!; a.download = `Payment-${selectedInvoice.bomNumber}.jpg`; a.click(); }}
                              style={{ fontSize: "12px", color: "#6f42c1", background: "none", border: "none", cursor: "pointer", fontFamily: "Poppins, sans-serif" }}>
                              📥 Download Screenshot
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa" }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>💳</div>
                    <div style={{ fontSize: "14px", marginBottom: "16px" }}>No payment recorded yet</div>
                    {selectedInvoice.status === 'pending' && (
                      <button onClick={() => { setApprovePayment({ method: "", amount: selectedInvoice.totalAmount, screenshot: "", notes: "" }); setShowApprovePaymentModal(true); }}
                        style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontFamily: "Poppins, sans-serif", fontWeight: "600" }}>
                        Add Payment & Approve
                      </button>
                    )}
                  </div>
                )}
              </Tabs.Panel>
            </Tabs>

            {/* Action buttons */}
            <div style={{ padding: "16px 28px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <Button onClick={() => downloadInvoicePDF(selectedInvoice)} style={{ backgroundColor: "#6f42c1", color: "white" }}>
                Download PO PDF
              </Button>
              <Button
                onClick={async () => {
                  const items = selectedInvoice.bomData?.items?.map((item: any) => {
                    const rate = selectedInvoice.bestQuote?.itemRates?.[item.itemName] || selectedInvoice.bestQuote?.itemRates?.[item.id];
                    return { ...item, unitPrice: rate?.unitPrice || 0 };
                  });
                  const res = await fetch('/api/whatsapp/send-po', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      suppliers: [{ name: selectedInvoice.supplierName, phone: selectedInvoice.bestQuote?.supplierPhone || '' }],
                      poNumber: selectedInvoice.bomNumber,
                      items,
                      deliveryDate: selectedInvoice.deliveryDate,
                      paymentTerms: selectedInvoice.bomData?.paymentTerms || '',
                      totalAmount: selectedInvoice.totalAmount,
                    }),
                  });
                  const data = await res.json();
                  if (data.suppliers?.[0]?.whatsappLink) {
                    window.open(data.suppliers[0].whatsappLink, '_blank');
                  } else {
                    alert('Could not generate WhatsApp link — check supplier phone number.');
                  }
                }}
                style={{ backgroundColor: "#25D366", color: "white" }}
              >
                Send via WhatsApp
              </Button>
              {selectedInvoice.status === 'pending' && (
                <Button onClick={() => { setApprovePayment({ method: "", amount: selectedInvoice.totalAmount, screenshot: "", notes: "" }); setShowApprovePaymentModal(true); }} style={{ backgroundColor: "#28a745", color: "white" }}>
                  Approve PO
                </Button>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* Approve PO Payment Modal */}
      {showApprovePaymentModal && selectedInvoice && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ backgroundColor: "white", borderRadius: "12px", width: "440px", fontFamily: "Poppins, sans-serif", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            {/* Header */}
            <div style={{ backgroundColor: "#111", padding: "20px 24px", borderRadius: "12px 12px 0 0", position: "relative" }}>
              <button onClick={() => setShowApprovePaymentModal(false)} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontSize: "15px" }}>×</button>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Approve Purchase Order</div>
              <div style={{ color: "white", fontSize: "16px", fontWeight: "700" }}>{selectedInvoice.bomNumber}</div>
              <div style={{ color: "#4ade80", fontSize: "14px", fontWeight: "600", marginTop: "2px" }}>PKR {Number(selectedInvoice.totalAmount).toLocaleString()}</div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Payment Amount */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#333" }}>Payment Amount (PKR) *</label>
                <input type="number" value={approvePayment.amount}
                  onChange={e => setApprovePayment({ ...approvePayment, amount: Number(e.target.value) })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "Poppins, sans-serif" }} />
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#333" }}>Payment Method *</label>
                <select value={approvePayment.method} onChange={e => setApprovePayment({ ...approvePayment, method: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", background: "white", fontFamily: "Poppins, sans-serif", cursor: "pointer" }}>
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Payment Screenshot */}
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#333" }}>Payment Proof / Screenshot</label>
                <input type="file" accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setApprovePayment({ ...approvePayment, screenshot: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{ width: "100%", padding: "8px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "12px", fontFamily: "Poppins, sans-serif" }} />
                {approvePayment.screenshot && (
                  <img src={approvePayment.screenshot} alt="proof" style={{ marginTop: "8px", maxWidth: "100%", maxHeight: "140px", borderRadius: "6px", border: "1px solid #e0e0e0", display: "block" }} />
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "#333" }}>Notes</label>
                <textarea value={approvePayment.notes} onChange={e => setApprovePayment({ ...approvePayment, notes: e.target.value })}
                  placeholder="Any additional payment details..."
                  rows={2}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e0e0e0", borderRadius: "8px", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "Poppins, sans-serif", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setShowApprovePaymentModal(false)}
                  style={{ flex: 1, padding: "10px", border: "1px solid #e0e0e0", borderRadius: "8px", background: "white", fontSize: "13px", cursor: "pointer", fontFamily: "Poppins, sans-serif", color: "#555" }}>
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!approvePayment.method) { alert("Please select a payment method"); return; }
                    await updateInvoiceStatus(selectedInvoice.id, 'approved', approvePayment);
                    setShowApprovePaymentModal(false);
                    setShowInvoiceModal(false);
                    setApprovePayment({ method: "", amount: 0, screenshot: "", notes: "" });
                  }}
                  style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", background: "#28a745", color: "white", fontSize: "13px", cursor: "pointer", fontFamily: "Poppins, sans-serif", fontWeight: "600" }}>
                  Confirm & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Approved Toast */}
      {invoiceApprovedToast && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#111", color: "white", padding: "14px 24px", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontFamily: "Poppins, sans-serif", fontSize: "14px", fontWeight: "500", minWidth: "280px", justifyContent: "center" }}>
          <span style={{ fontSize: "18px" }}>✓</span>
          Invoice approved successfully!
        </div>
      )}
    </ProtectedRoute>
  );
}
