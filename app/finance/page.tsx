"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Tabs, Table, Badge, Modal } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

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
