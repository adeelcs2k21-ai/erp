"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Tabs, Table, Badge, Modal } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

function ClientOrdersPanel() {
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [orderSubTab, setOrderSubTab] = useState<string | null>("pending");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalTab, setModalTab] = useState<string | null>("details");
  const [paymentDetails, setPaymentDetails] = useState({ amount: 0, method: "", screenshot: "", notes: "" });
  const [loading, setLoading] = useState(true);

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
    if (!client || !client.phone) {
      alert("Client phone number not available");
      return;
    }
    
    const message = `*Order Confirmation*\n\nDear ${client.name},\n\nYour order has been confirmed:\n\n*Product:* ${order.product_name}\n*Quantity:* ${order.quantity} ${order.unit}\n*Unit Price:* PKR ${Number(order.unit_price || 0).toFixed(2)}\n*Tax:* PKR ${Number(order.tax || 0).toFixed(2)}\n*Transport:* PKR ${Number(order.transport || 0).toFixed(2)}\n*Other Charges:* PKR ${Number(order.other_charges || 0).toFixed(2)}\n\n*Total Amount:* PKR ${Number(order.total_price || 0).toFixed(2)}\n\nPlease proceed with the payment.\n\nThank you!`;
    
    const whatsappUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Update order status to po_sent
    await fetch("/api/crm/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: order.id,
        status: "po_sent"
      })
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
          {approvedOrders.length === 0 ? (
            <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>
              No payment confirmed orders yet.
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
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase" }}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedOrders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0", cursor: "pointer" }} onClick={() => { setSelectedOrder(order); setModalTab("details"); setShowOrderModal(true); }}>
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
          )}
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
  const right = pageWidth - 14;

  // ── Header bar ──
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PURCHASE INVOICE", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${invoice.bomNumber}`, right, 12, { align: "right" });
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, right, 20, { align: "right" });

  // ── Reset text color ──
  doc.setTextColor(0, 0, 0);

  // ── From / To ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FROM (Supplier)", 14, 38);
  doc.text("TO (Company)", pageWidth / 2 + 5, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(invoice.supplierName || "N/A", 14, 46);
  doc.text("Internal Purchase", pageWidth / 2 + 5, 46);

  // ── Meta info ──
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Created By: ${invoice.createdBy}`, 14, 58);
  doc.text(`Delivery Date: ${new Date(invoice.deliveryDate).toLocaleDateString()}`, 14, 65);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 14, 72);
  doc.setTextColor(0, 0, 0);

  // ── Divider ──
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 76, right, 76);

  // ── Items table ──
  const items = invoice.bomData?.items || [];
  const itemRates = invoice.bestQuote?.itemRates || {};
  const rows = items.map((item: any) => {
    const rate = itemRates[item.itemName] || itemRates[item.id] || {};
    const unitPrice = rate.unitPrice || 0;
    const total = unitPrice * item.quantity;
    return [item.itemName, item.itemType, item.quantity, item.unit, `PKR ${unitPrice.toLocaleString()}`, `PKR ${total.toLocaleString()}`];
  });

  autoTable(doc, {
    startY: 82,
    head: [["Item Name", "Type", "Qty", "Unit", "Unit Price", "Total"]],
    body: rows,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
  });

  // ── Cost summary ──
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const transport = invoice.bestQuote?.transportCost || 0;
  const tax = invoice.bestQuote?.tax || 0;
  const subtotal = invoice.totalAmount - transport - tax;

  const summaryX = pageWidth - 90;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", summaryX, finalY);
  doc.text(`PKR ${subtotal.toLocaleString()}`, right, finalY, { align: "right" });

  if (transport > 0) {
    doc.text("Transport:", summaryX, finalY + 8);
    doc.text(`PKR ${transport.toLocaleString()}`, right, finalY + 8, { align: "right" });
  }
  if (tax > 0) {
    doc.text("Tax:", summaryX, finalY + 16);
    doc.text(`PKR ${tax.toLocaleString()}`, right, finalY + 16, { align: "right" });
  }

  const totalY = finalY + (transport > 0 ? 8 : 0) + (tax > 0 ? 8 : 0) + 12;
  doc.setDrawColor(0, 0, 0);
  doc.line(summaryX, totalY - 4, right, totalY - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", summaryX, totalY + 2);
  doc.text(`PKR ${invoice.totalAmount.toLocaleString()}`, right, totalY + 2, { align: "right" });

  // ── Footer ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a system-generated invoice.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  doc.save(`Invoice-${invoice.bomNumber}-${Date.now()}.pdf`);
};

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
}

export default function Finance() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('overview');
  const [bomInvoices, setBomInvoices] = useState<BOMInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<BOMInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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

  const updateInvoiceStatus = async (invoiceId: string, status: 'pending' | 'approved') => {
    try {
      const res = await fetch("/api/finance/bom-invoices", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: invoiceId, status }),
      });
      
      if (res.ok) {
        fetchBOMInvoices(); // Refresh the list
        alert(`Invoice ${status} successfully!`);
      } else {
        alert('Failed to update invoice status');
      }
    } catch (error) {
      console.error("Error updating invoice status:", error);
      alert('Error updating invoice status');
    }
  };

  const pendingInvoices = bomInvoices.filter(invoice => invoice.status === 'pending');
  const approvedInvoices = bomInvoices.filter(invoice => invoice.status === 'approved');

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
                    onClick={() => updateInvoiceStatus(invoice.id, 'approved')}
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
                Finance
              </Text>
              
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="overview">Overview</Tabs.Tab>
                  <Tabs.Tab value="bom">Purchase Orders</Tabs.Tab>
                  <Tabs.Tab value="client-orders">Client Orders</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="md">
                  <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>
                    Finance module overview coming soon.
                  </Text>
                </Tabs.Panel>

                <Tabs.Panel value="bom" pt="md">
                  <Tabs defaultValue="pending">
                    <Tabs.List>
                      <Tabs.Tab value="pending">
                        Pending BOMs ({pendingInvoices.length})
                      </Tabs.Tab>
                      <Tabs.Tab value="approved">
                        Approved BOMs ({approvedInvoices.length})
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="pending" pt="md">
                      <div style={{ 
                        backgroundColor: "#fff", 
                        border: "1px solid #e9ecef", 
                        borderRadius: "8px",
                        overflow: "hidden"
                      }}>
                        {pendingInvoices.length > 0 ? (
                          renderInvoiceTable(pendingInvoices, true)
                        ) : (
                          <div style={{ 
                            padding: "40px", 
                            textAlign: "center", 
                            color: "#6c757d",
                            fontFamily: "Poppins, sans-serif"
                          }}>
                            No pending BOM invoices
                          </div>
                        )}
                      </div>
                    </Tabs.Panel>

                    <Tabs.Panel value="approved" pt="md">
                      <div style={{ 
                        backgroundColor: "#fff", 
                        border: "1px solid #e9ecef", 
                        borderRadius: "8px",
                        overflow: "hidden"
                      }}>
                        {approvedInvoices.length > 0 ? (
                          renderInvoiceTable(approvedInvoices, false)
                        ) : (
                          <div style={{ 
                            padding: "40px", 
                            textAlign: "center", 
                            color: "#6c757d",
                            fontFamily: "Poppins, sans-serif"
                          }}>
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

            {/* Items table */}
            <div style={{ padding: "20px 28px" }}>
              <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "10px", color: "#333" }}>Items</Text>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Unit</Table.Th>
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

              {/* Cost summary */}
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                  <Text>Subtotal</Text>
                  <Text>PKR {(selectedInvoice.totalAmount - (selectedInvoice.bestQuote?.transportCost || 0) - (selectedInvoice.bestQuote?.tax || 0)).toLocaleString()}</Text>
                </div>
                {(selectedInvoice.bestQuote?.transportCost || 0) > 0 && (
                  <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                    <Text>Transport</Text>
                    <Text>PKR {selectedInvoice.bestQuote.transportCost.toLocaleString()}</Text>
                  </div>
                )}
                {(selectedInvoice.bestQuote?.tax || 0) > 0 && (
                  <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                    <Text>Tax</Text>
                    <Text>PKR {selectedInvoice.bestQuote.tax.toLocaleString()}</Text>
                  </div>
                )}
                <div style={{ display: "flex", gap: "40px", fontSize: "16px", fontWeight: "700", borderTop: "1px solid #e0e0e0", paddingTop: "8px", marginTop: "4px" }}>
                  <Text>Total</Text>
                  <Text style={{ color: "#28a745" }}>PKR {selectedInvoice.totalAmount.toLocaleString()}</Text>
                </div>
              </div>
            </div>

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
                <Button onClick={() => { updateInvoiceStatus(selectedInvoice.id, 'approved'); setShowInvoiceModal(false); }} style={{ backgroundColor: "#28a745", color: "white" }}>
                  Approve PO
                </Button>
              )}
            </div>

          </div>
        )}
      </Modal>
      
      <LogoutButton />
    </ProtectedRoute>
  );
}
