"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Table, Badge, Tabs, Modal, Drawer, TextInput, Select, NumberInput, Textarea, Group, ActionIcon, MultiSelect, Stack, Paper } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

// Enhanced Suppliers Tab Component
function SuppliersTab({ 
  suppliers, 
  setShowSupplierForm, 
  setShowBomComparison,
  allBoms = [],
  allQuotes = [],
  editSupplier,
  deleteSupplier
}: {
  suppliers: any[];
  setShowSupplierForm: (show: boolean) => void;
  setShowBomComparison: (show: boolean) => void;
  allBoms?: any[];
  allQuotes?: any[];
  editSupplier: (supplier: any) => void;
  deleteSupplier: (id: string) => void;
}) {
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false);
  const [selectedBOMDetail, setSelectedBOMDetail] = useState<any>(null);
  const [selectedPODetail, setSelectedPODetail] = useState<any>(null);
  const [showSupplierDetail, setShowSupplierDetail] = useState(false);
  const [bomSends, setBomSends] = useState<any[]>([]);
  const [supplierQuotes, setSupplierQuotes] = useState<any[]>([]);
  const [bomInvoices, setBomInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBomData = async () => {
      try {
        const [bomSendsRes, quotesRes, invoicesRes] = await Promise.all([
          fetch("/api/bom-sends"),
          fetch("/api/supplier/quotes"),
          fetch("/api/finance/bom-invoices"),
        ]);
        if (bomSendsRes.ok) setBomSends(await bomSendsRes.json());
        if (quotesRes.ok) setSupplierQuotes(await quotesRes.json());
        if (invoicesRes.ok) setBomInvoices(await invoicesRes.json());
      } catch (error) {
        console.error("Error fetching BOM data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBomData();
  }, []);

  const getSupplierBoms = (supplierId: string) => {
    return bomSends.filter((bom) => bom.supplierId === supplierId);
  };

  const getSupplierQuotes = (supplierId: string) => {
    return supplierQuotes.filter((quote) => quote.supplierId === supplierId);
  };

  const handleViewBoms = (supplier: any) => {
    setSelectedSupplier(supplier);
    setShowDrawer(true);
  };

  const getUniqueBomNumbers = () => {
    const bomNumbers = [...new Set(bomSends.map(bom => bom.bomNumber))];
    return bomNumbers;
  };

  if (loading) {
    return (
      <Box style={{ padding: "40px", textAlign: "center" }}>
        <Text style={{ color: "#666" }}>Loading suppliers...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <Text style={{ fontSize: "18px", fontWeight: "500", fontFamily: "Poppins, sans-serif" }}>
          Suppliers
        </Text>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowBomComparison(true)}
            disabled={getUniqueBomNumbers().length === 0}
            style={{
              padding: "8px 16px",
              backgroundColor: "white",
              color: getUniqueBomNumbers().length === 0 ? "#ccc" : "#000",
              border: "1px solid #e0e0e0",
              fontSize: "13px",
              fontWeight: "400",
              cursor: getUniqueBomNumbers().length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Compare BOM Quotes
          </button>
          <button
            onClick={() => setShowSupplierForm(true)}
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
            + Add Supplier
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      {suppliers.length === 0 ? (
        <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif", textAlign: "center", padding: "40px" }}>
          No suppliers yet.
        </Text>
      ) : (
        <div style={{ backgroundColor: "white", border: "1px solid #e0e0e0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Supplier</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contact</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "11px", fontWeight: "500", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "16px", cursor: "pointer" }} onClick={() => { setSelectedSupplier(supplier); setShowSupplierDetail(true); }}>
                    <div style={{ fontWeight: "600", color: "#007bff", marginBottom: "2px" }}>{supplier.name}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{supplier.address || "No address"}</div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontSize: "13px", color: "#333", marginBottom: "2px" }}>{supplier.email}</div>
                    <div style={{ fontSize: "11px", color: "#888" }}>{supplier.phone}</div>
                  </td>
                  <td style={{ padding: "16px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button onClick={() => { setSelectedSupplier(supplier); setShowDrawer(true); }} style={{ padding: "6px 12px", backgroundColor: "white", color: "#000", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>BOMs</button>
                      <button onClick={() => { setSelectedSupplier(supplier); setShowPOModal(true); }} style={{ padding: "6px 12px", backgroundColor: "white", color: "#000", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>POs</button>
                      <button onClick={() => editSupplier(supplier)} style={{ padding: "6px 12px", backgroundColor: "white", color: "#000", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                      <button onClick={() => { if (window.confirm(`Delete ${supplier.name}?`)) deleteSupplier(supplier.id); }} style={{ padding: "6px 12px", backgroundColor: "white", color: "#dc3545", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Detail Modal */}
      {showSupplierDetail && selectedSupplier && (
        <Modal opened={showSupplierDetail} onClose={() => setShowSupplierDetail(false)} title="Supplier Details" size="md">
          <div style={{ fontFamily: "Poppins, sans-serif", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { label: "Name", value: selectedSupplier.name },
                { label: "Category / Type", value: selectedSupplier.business_type || selectedSupplier.businessType || "—" },
                { label: "Email", value: selectedSupplier.email || "—" },
                { label: "Phone", value: selectedSupplier.phone || "—" },
                { label: "Address", value: selectedSupplier.address || "—" },
                { label: "Contact Person", value: selectedSupplier.contact_person || selectedSupplier.contactPerson || "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                  <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</Text>
                  <Text style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{value}</Text>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid #f0f0f0" }}>
              <button onClick={() => { setShowSupplierDetail(false); setSelectedSupplier(selectedSupplier); setShowDrawer(true); }} style={{ padding: "8px 16px", border: "1px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "13px" }}>View BOMs</button>
              <button onClick={() => { setShowSupplierDetail(false); setSelectedSupplier(selectedSupplier); setShowPOModal(true); }} style={{ padding: "8px 16px", border: "1px solid #e0e0e0", background: "white", cursor: "pointer", fontSize: "13px" }}>View POs</button>
            </div>
          </div>
        </Modal>
      )}

      {/* BOMs Modal */}
      {showDrawer && selectedSupplier && (
        <Modal opened={showDrawer} onClose={() => { setShowDrawer(false); setSelectedBOMDetail(null); }} title={selectedBOMDetail ? `BOM — ${selectedBOMDetail.bomNumber}` : `${selectedSupplier.name} — BOMs Sent`} size="xl">
          {selectedBOMDetail ? (
            // Full BOM detail
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              <button onClick={() => setSelectedBOMDetail(null)} style={{ background: "none", border: "none", color: "#007bff", cursor: "pointer", fontSize: "13px", marginBottom: "16px", padding: 0 }}>← Back to list</button>
              <div style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { label: "BOM Number", value: selectedBOMDetail.bomNumber },
                  { label: "Supplier", value: selectedSupplier.name },
                  { label: "Sent On", value: new Date(selectedBOMDetail.sentAt).toLocaleDateString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <Text style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</Text>
                    <Text style={{ fontSize: "14px", fontWeight: "600" }}>{value}</Text>
                  </div>
                ))}
              </div>
              <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "10px" }}>Items</Text>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Quantity</Table.Th>
                    <Table.Th>Unit</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedBOMDetail.items?.map((item: any) => (
                    <Table.Tr key={item.itemName}>
                      <Table.Td style={{ fontWeight: "600" }}>{item.itemName}</Table.Td>
                      <Table.Td>{item.itemType}</Table.Td>
                      <Table.Td>{item.quantity}</Table.Td>
                      <Table.Td>{item.unit}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          ) : (
            // BOM list
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              {getSupplierBoms(selectedSupplier.id).length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#999", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>No BOMs sent to this supplier yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {getSupplierBoms(selectedSupplier.id).map((bom: any) => (
                    <div key={bom.id} onClick={() => setSelectedBOMDetail(bom)} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8f9ff")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "white")}
                    >
                      <div>
                        <Text style={{ fontWeight: "700", fontSize: "14px" }}>{bom.bomNumber}</Text>
                        <Text style={{ fontSize: "12px", color: "#888" }}>Sent: {new Date(bom.sentAt).toLocaleDateString()} · {bom.items?.length || 0} items</Text>
                      </div>
                      <Text style={{ fontSize: "12px", color: "#007bff" }}>View details →</Text>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* POs Modal */}
      {showPOModal && selectedSupplier && (
        <Modal opened={showPOModal} onClose={() => { setShowPOModal(false); setSelectedPODetail(null); }} title={selectedPODetail ? "" : `${selectedSupplier.name} — Purchase Orders`} size="xl"
          styles={selectedPODetail ? { header: { display: "none" }, body: { padding: 0 } } : {}}>
          {selectedPODetail ? (
            // Full PO detail — same style as finance portal
            <div style={{ fontFamily: "Poppins, sans-serif", position: "relative" }}>
              {/* Dark header */}
              <div style={{ backgroundColor: "#111", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                <div>
                  <button onClick={() => setSelectedPODetail(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "12px", padding: 0, marginBottom: "6px" }}>← Back to list</button>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Purchase Order</Text>
                  <Text style={{ color: "white", fontSize: "22px", fontWeight: "700" }}>{selectedPODetail.bomNumber}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginTop: "4px" }}>
                    Created by {selectedPODetail.createdBy} · {new Date(selectedPODetail.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text style={{ color: "#4ade80", fontSize: "26px", fontWeight: "700" }}>PKR {(selectedPODetail.totalAmount || 0).toLocaleString()}</Text>
                  <Badge color={selectedPODetail.status === 'approved' ? 'green' : 'yellow'} style={{ marginTop: "6px" }}>{selectedPODetail.status}</Badge>
                </div>
                <button onClick={() => { setShowPOModal(false); setSelectedPODetail(null); }} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px" }}>×</button>
              </div>

              {/* Info row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
                {[
                  { label: "Supplier", value: selectedPODetail.supplierName },
                  { label: "Delivery Date", value: selectedPODetail.deliveryDate ? new Date(selectedPODetail.deliveryDate).toLocaleDateString() : "—" },
                  { label: "Date Created", value: new Date(selectedPODetail.createdAt).toLocaleDateString() },
                ].map(({ label, value }, i) => (
                  <div key={label} style={{ padding: "14px 20px", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                    <Text style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</Text>
                    <Text style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{value}</Text>
                  </div>
                ))}
              </div>

              {/* Items */}
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
                    {selectedPODetail.bomData?.items?.map((item: any) => {
                      const rate = selectedPODetail.bestQuote?.itemRates?.[item.itemName] || selectedPODetail.bestQuote?.itemRates?.[item.id];
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
                    <Text>PKR {((selectedPODetail.totalAmount || 0) - (selectedPODetail.bestQuote?.transportCost || 0) - (selectedPODetail.bestQuote?.tax || 0)).toLocaleString()}</Text>
                  </div>
                  {(selectedPODetail.bestQuote?.transportCost || 0) > 0 && (
                    <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                      <Text>Transport</Text>
                      <Text>PKR {selectedPODetail.bestQuote.transportCost.toLocaleString()}</Text>
                    </div>
                  )}
                  {(selectedPODetail.bestQuote?.tax || 0) > 0 && (
                    <div style={{ display: "flex", gap: "40px", fontSize: "13px", color: "#666" }}>
                      <Text>Tax</Text>
                      <Text>PKR {selectedPODetail.bestQuote.tax.toLocaleString()}</Text>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "40px", fontSize: "16px", fontWeight: "700", borderTop: "1px solid #e0e0e0", paddingTop: "8px", marginTop: "4px" }}>
                    <Text>Total</Text>
                    <Text style={{ color: "#28a745" }}>PKR {(selectedPODetail.totalAmount || 0).toLocaleString()}</Text>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid #f0f0f0", display: "flex", gap: "10px" }}>
                <Button onClick={async () => {
                  const { default: jsPDF } = await import("jspdf");
                  const { default: autoTable } = await import("jspdf-autotable");
                  const doc = new jsPDF();
                  const pw = doc.internal.pageSize.getWidth();
                  doc.setFillColor(20,20,20); doc.rect(0,0,pw,28,"F");
                  doc.setTextColor(255,255,255); doc.setFontSize(16); doc.setFont("helvetica","bold");
                  doc.text("PURCHASE ORDER", 14, 18);
                  doc.setFontSize(10); doc.setFont("helvetica","normal");
                  doc.text(`PO#: ${selectedPODetail.bomNumber}`, pw-14, 12, { align:"right" });
                  doc.text(`Date: ${new Date(selectedPODetail.createdAt).toLocaleDateString()}`, pw-14, 20, { align:"right" });
                  doc.setTextColor(0,0,0);
                  doc.setFontSize(10);
                  doc.text(`Supplier: ${selectedPODetail.supplierName}`, 14, 38);
                  doc.text(`Delivery: ${selectedPODetail.deliveryDate ? new Date(selectedPODetail.deliveryDate).toLocaleDateString() : "—"}`, 14, 46);
                  const rows = selectedPODetail.bomData?.items?.map((item: any) => {
                    const rate = selectedPODetail.bestQuote?.itemRates?.[item.itemName] || selectedPODetail.bestQuote?.itemRates?.[item.id];
                    return [item.itemName, item.itemType, item.quantity, item.unit, `PKR ${(rate?.unitPrice||0).toLocaleString()}`, `PKR ${((rate?.unitPrice||0)*item.quantity).toLocaleString()}`];
                  }) || [];
                  autoTable(doc, { startY: 54, head:[["Item","Type","Qty","Unit","Unit Price","Total"]], body: rows, headStyles:{ fillColor:[30,30,30], textColor:255 }, alternateRowStyles:{ fillColor:[248,248,248] } });
                  const y = (doc as any).lastAutoTable.finalY + 10;
                  doc.setFont("helvetica","bold"); doc.setFontSize(12);
                  doc.text(`Total: PKR ${(selectedPODetail.totalAmount||0).toLocaleString()}`, pw-14, y, { align:"right" });
                  doc.save(`PO-${selectedPODetail.bomNumber}.pdf`);
                }} style={{ backgroundColor: "#6f42c1", color: "white" }}>Download PDF</Button>

                <Button onClick={async () => {
                  const items = selectedPODetail.bomData?.items?.map((item: any) => {
                    const rate = selectedPODetail.bestQuote?.itemRates?.[item.itemName] || selectedPODetail.bestQuote?.itemRates?.[item.id];
                    return { ...item, unitPrice: rate?.unitPrice || 0 };
                  });
                  const phone = selectedSupplier?.phone || '';
                  const res = await fetch('/api/whatsapp/send-po', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      suppliers: [{ name: selectedPODetail.supplierName, phone }],
                      poNumber: selectedPODetail.bomNumber,
                      items,
                      deliveryDate: selectedPODetail.deliveryDate,
                      paymentTerms: selectedPODetail.bomData?.paymentTerms || '',
                      totalAmount: selectedPODetail.totalAmount,
                    }),
                  });
                  const data = await res.json();
                  if (data.suppliers?.[0]?.whatsappLink) {
                    window.open(data.suppliers[0].whatsappLink, '_blank');
                  } else {
                    alert('Could not generate WhatsApp link — check supplier phone number.');
                  }
                }} style={{ backgroundColor: "#25D366", color: "white" }}>Send to Supplier</Button>
              </div>
            </div>
          ) : (
            // PO list
            <div style={{ fontFamily: "Poppins, sans-serif" }}>
              {(() => {
                const supplierPOs = bomInvoices.filter((inv: any) => inv.supplierName === selectedSupplier.name);
                return supplierPOs.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#999", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>No approved POs for this supplier yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {supplierPOs.map((inv: any) => (
                      <div key={inv.id} onClick={() => setSelectedPODetail(inv)} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "white" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f8f9ff")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "white")}
                      >
                        <div>
                          <Text style={{ fontWeight: "700", fontSize: "14px" }}>{inv.bomNumber}</Text>
                          <Text style={{ fontSize: "12px", color: "#888" }}>{new Date(inv.createdAt).toLocaleDateString()} · {inv.bomData?.items?.length || 0} items</Text>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <Text style={{ fontWeight: "700", color: "#28a745", fontSize: "15px" }}>PKR {(inv.totalAmount || 0).toLocaleString()}</Text>
                          <Badge color={inv.status === 'approved' ? 'green' : 'yellow'} size="xs">{inv.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </Modal>
      )}
    </Box>
  );
}

export default function Purchase() {
  const [currentPage, setCurrentPage] = useState(2);
  const [orders, setOrders] = useState<any[]>([]);
  const [bomFinanceStatus, setBomFinanceStatus] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<string | null>("po");
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [bomRates, setBomRates] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showBomComparison, setShowBomComparison] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplierForBOMs, setSelectedSupplierForBOMs] = useState<any>(null);
  const [showSupplierBOMs, setShowSupplierBOMs] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedBOMForQuote, setSelectedBOMForQuote] = useState<any>(null);
  
  // BOM Form State
  const [bomForm, setBomForm] = useState({
    items: [{ itemName: '', itemType: 'Raw Material', quantity: 1, unit: 'pieces' }],
    deliveryDate: '',
    paymentTerms: '',
    notes: '',
    selectedSuppliers: [] as string[]
  });
  
  // Supplier Form State
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    businessType: ''
  });

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    itemRates: {} as {[key: string]: {unitPrice: number, totalPrice: number}},
    transportCost: 0,
    tax: 0,
    validUntil: '',
    notes: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchBOMRates();
    fetchSuppliers();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const checkAllFinanceStatus = async () => {
      try {
        const res = await fetch('/api/finance/bom-invoices');
        const invoices = await res.json();
        const statusMap: {[key: string]: boolean} = {};
        
        orders.forEach(order => {
          const existingInvoice = invoices.find((invoice: any) => invoice.bomId === order.id);
          statusMap[order.id] = !!existingInvoice;
        });
        
        setBomFinanceStatus(statusMap);
      } catch (error) {
        console.error('Error checking finance status:', error);
      }
    };
    
    if (orders.length > 0) {
      checkAllFinanceStatus();
    }
  }, [orders]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?userId=superadmin");
      const data = await res.json();
      setNotifications(data.filter((n: any) => !n.read));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId })
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notificationId })
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const fetchBOMRates = async () => {
    try {
      const res = await fetch("/api/bom-rates");
      const data = await res.json();
      setBomRates(data);
    } catch (error) {
      console.error("Error fetching BOM rates:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/purchase/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "gray";
      case "pending_approval": return "yellow";
      case "approved": return "green";
      case "rejected": return "red";
      case "sent_to_supplier": return "blue";
      case "sent_to_finance": return "purple";
      case "completed": return "teal";
      default: return "gray";
    }
  };

  const pendingOrders = orders.filter(order => !bomFinanceStatus[order.id]);
  const sentToFinanceOrders = orders.filter(order => bomFinanceStatus[order.id]);

  const addBomItem = () => {
    setBomForm(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', itemType: 'Raw Material', quantity: 1, unit: 'pieces' }]
    }));
  };

  const removeBomItem = (index: number) => {
    setBomForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateBomItem = (index: number, field: string, value: any) => {
    setBomForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const submitBOM = async () => {
    try {
      const totalAmount = bomForm.items.reduce((sum, item) => sum + (item.quantity * 10), 0); // Placeholder calculation
      
      // Get selected supplier objects
      const selectedSupplierObjects = suppliers.filter(supplier => 
        bomForm.selectedSuppliers.includes(supplier.id)
      );
      
      const response = await fetch('/api/purchase/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bomForm,
          suppliers: selectedSupplierObjects,
          totalAmount,
          createdBy: 'superadmin'
        })
      });

      if (response.ok) {
        alert('BOM created successfully!');
        setBomForm({
          items: [{ itemName: '', itemType: 'Raw Material', quantity: 1, unit: 'pieces' }],
          deliveryDate: '',
          paymentTerms: '',
          notes: '',
          selectedSuppliers: []
        });
        setShowForm(false);
        fetchOrders();
      } else {
        alert('Failed to create BOM');
      }
    } catch (error) {
      console.error('Error creating BOM:', error);
      alert('Error creating BOM');
    }
  };

  const submitSupplier = async () => {
    try {
      const method = editingSupplier ? 'PUT' : 'POST';
      const body = editingSupplier 
        ? { ...supplierForm, id: editingSupplier.id }
        : supplierForm;

      const response = await fetch('/api/suppliers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        alert(`Supplier ${editingSupplier ? 'updated' : 'created'} successfully!`);
        setSupplierForm({
          name: '',
          email: '',
          phone: '',
          address: '',
          contactPerson: '',
          businessType: ''
        });
        setShowSupplierForm(false);
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        alert(`Failed to ${editingSupplier ? 'update' : 'create'} supplier`);
      }
    } catch (error) {
      console.error('Error with supplier:', error);
      alert('Error with supplier operation');
    }
  };

  const editSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      businessType: supplier.businessType || ''
    });
    setShowSupplierForm(true);
  };

  const deleteSupplier = async (id: string) => {
    try {
      const res = await fetch("/api/suppliers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        fetchSuppliers(); // Refresh the suppliers list
      } else {
        alert("Failed to delete supplier");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Error deleting supplier");
    }
  };

  const viewSupplierBOMs = (supplier: any) => {
    setSelectedSupplierForBOMs(supplier);
    setShowSupplierBOMs(true);
  };

  const getSupplierBOMs = (supplierId: string) => {
    return orders.filter(order => 
      order.suppliers && order.suppliers.some((sup: any) => sup.id === supplierId)
    );
  };

  const openQuoteForm = (bom: any, supplier: any) => {
    setSelectedBOMForQuote({ bom, supplier });
    
    // Initialize quote form with BOM items
    const itemRates: {[key: string]: {unitPrice: number, totalPrice: number}} = {};
    bom.items?.forEach((item: any) => {
      itemRates[item.id] = { unitPrice: 0, totalPrice: 0 };
    });
    
    setQuoteForm({
      itemRates,
      transportCost: 0,
      tax: 0,
      validUntil: '',
      notes: ''
    });
    setShowQuoteForm(true);
  };

  const updateItemRate = (itemId: string, field: 'unitPrice' | 'totalPrice', value: number) => {
    setQuoteForm(prev => ({
      ...prev,
      itemRates: {
        ...prev.itemRates,
        [itemId]: {
          ...prev.itemRates[itemId],
          [field]: value,
          // Auto-calculate the other field
          ...(field === 'unitPrice' 
            ? { totalPrice: value * (selectedBOMForQuote?.bom?.items?.find((item: any) => item.id === itemId)?.quantity || 1) }
            : { unitPrice: value / (selectedBOMForQuote?.bom?.items?.find((item: any) => item.id === itemId)?.quantity || 1) }
          )
        }
      }
    }));
  };

  const submitQuote = async () => {
    try {
      const itemsSubtotal = Object.values(quoteForm.itemRates).reduce((sum, rate) => sum + rate.totalPrice, 0);
      const totalAmount = itemsSubtotal + quoteForm.transportCost + quoteForm.tax;

      const response = await fetch('/api/bom-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bomId: selectedBOMForQuote.bom.id,
          supplierId: selectedBOMForQuote.supplier.id,
          supplierName: selectedBOMForQuote.supplier.name,
          itemRates: quoteForm.itemRates,
          transportCost: quoteForm.transportCost,
          tax: quoteForm.tax,
          totalAmount,
          validUntil: quoteForm.validUntil,
          notes: quoteForm.notes,
          status: 'submitted'
        })
      });

      if (response.ok) {
        alert('Quote submitted successfully!');
        setShowQuoteForm(false);
        setSelectedBOMForQuote(null);
        fetchBOMRates();
      } else {
        alert('Failed to submit quote');
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error submitting quote');
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
                              backgroundColor: "#f9f9f9",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start"
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <Text style={{ fontWeight: "600", fontSize: "11px" }}>
                                {notif.title}
                              </Text>
                              <Text style={{ fontSize: "11px", color: "#666", marginTop: "3px" }}>
                                {notif.message}
                              </Text>
                            </div>
                            <div style={{ display: "flex", gap: "4px", marginLeft: "8px" }}>
                              <ActionIcon
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markNotificationAsRead(notif.id);
                                }}
                                style={{ backgroundColor: "#28a745", color: "white" }}
                              >
                                ✓
                              </ActionIcon>
                              <ActionIcon
                                size="xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notif.id);
                                }}
                                style={{ backgroundColor: "#dc3545", color: "white" }}
                              >
                                ×
                              </ActionIcon>
                            </div>
                          </Box>
                        ))
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Box>

            {/* Header with Add Button */}
            <Box style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <Text style={{ fontSize: "24px", fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                Bills of Material
              </Text>
              <Button
                onClick={() => setShowForm(true)}
                style={{
                  backgroundColor: "#007bff",
                  color: "#fff",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "14px",
                  fontWeight: "500",
                  borderRadius: "8px",
                  border: "none",
                  padding: "10px 20px",
                  boxShadow: "0 2px 4px rgba(0,123,255,0.2)"
                }}
              >
                + New BOM
              </Button>
            </Box>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="po">Bills of Material</Tabs.Tab>
                <Tabs.Tab value="suppliers">Suppliers</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="po" pt="md">
                <Tabs defaultValue="all">
                  <Tabs.List>
                    <Tabs.Tab value="all">All BOMs ({orders.length})</Tabs.Tab>
                    <Tabs.Tab value="pending">Pending ({pendingOrders.length})</Tabs.Tab>
                    <Tabs.Tab value="sent_to_finance">Sent to Finance ({sentToFinanceOrders.length})</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="all" pt="md">
                    <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                      All Bills of Material
                    </Text>
                    {orders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px" }}>No Bills of Material yet.</Text>
                    ) : (
                      <Table striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>BOM Number</Table.Th>
                            <Table.Th>Items</Table.Th>
                            <Table.Th>Total Amount</Table.Th>
                            <Table.Th>Delivery Date</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Action</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {orders.map((order) => {
                            const sentToFinance = bomFinanceStatus[order.id] || false;
                            const displayStatus = sentToFinance ? 'sent_to_finance' : order.status;
                            
                            return (
                              <Table.Tr key={order.id}>
                                <Table.Td>{order.poNumber}</Table.Td>
                                <Table.Td>{order.items?.length || 0}</Table.Td>
                                <Table.Td>PKR {order.totalAmount?.toFixed(2) || '0.00'}</Table.Td>
                                <Table.Td>{order.deliveryDate}</Table.Td>
                                <Table.Td>
                                  <Badge color={getStatusColor(displayStatus)}>
                                    {displayStatus.replace(/_/g, " ")}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <Button 
                                    size="xs" 
                                    style={{ 
                                      backgroundColor: "#007bff", 
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: "500",
                                      padding: "6px 12px"
                                    }}
                                    onClick={() => {
                                      setSelectedPO(order);
                                      setShowApprovalModal(true);
                                    }}
                                  >
                                    View
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="pending" pt="md">
                    <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                      Pending Bills of Material
                    </Text>
                    {pendingOrders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px" }}>No pending Bills of Material.</Text>
                    ) : (
                      <Table striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>BOM Number</Table.Th>
                            <Table.Th>Items</Table.Th>
                            <Table.Th>Total Amount</Table.Th>
                            <Table.Th>Delivery Date</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Action</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {pendingOrders.map((order) => (
                            <Table.Tr key={order.id}>
                              <Table.Td>{order.poNumber}</Table.Td>
                              <Table.Td>{order.items?.length || 0}</Table.Td>
                              <Table.Td>PKR {order.totalAmount?.toFixed(2) || '0.00'}</Table.Td>
                              <Table.Td>{order.deliveryDate}</Table.Td>
                              <Table.Td>
                                <Badge color={getStatusColor(order.status)}>
                                  {order.status.replace(/_/g, " ")}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Button 
                                  size="xs" 
                                  style={{ 
                                    backgroundColor: "#007bff", 
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    padding: "6px 12px"
                                  }}
                                  onClick={() => {
                                    setSelectedPO(order);
                                    setShowApprovalModal(true);
                                  }}
                                >
                                  View
                                </Button>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="sent_to_finance" pt="md">
                    <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px" }}>
                      Bills of Material Sent to Finance
                    </Text>
                    {sentToFinanceOrders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px" }}>No Bills of Material sent to finance yet.</Text>
                    ) : (
                      <Table striped>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>BOM Number</Table.Th>
                            <Table.Th>Items</Table.Th>
                            <Table.Th>Total Amount</Table.Th>
                            <Table.Th>Delivery Date</Table.Th>
                            <Table.Th>Status</Table.Th>
                            <Table.Th>Action</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {sentToFinanceOrders.map((order) => (
                            <Table.Tr key={order.id}>
                              <Table.Td>{order.poNumber}</Table.Td>
                              <Table.Td>{order.items?.length || 0}</Table.Td>
                              <Table.Td>PKR {order.totalAmount?.toFixed(2) || '0.00'}</Table.Td>
                              <Table.Td>{order.deliveryDate}</Table.Td>
                              <Table.Td>
                                <Badge color={getStatusColor('sent_to_finance')}>
                                  sent to finance
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                  <Button 
                                    size="xs" 
                                    style={{ 
                                      backgroundColor: "#007bff", 
                                      color: "#fff",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                      fontWeight: "500",
                                      padding: "6px 12px"
                                    }}
                                    onClick={() => {
                                      setSelectedPO(order);
                                      setShowApprovalModal(true);
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Badge color="green" size="sm">
                                    Processing in Finance
                                  </Badge>
                                </div>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>
                </Tabs>
              </Tabs.Panel>

              <Tabs.Panel value="suppliers" pt="md">
                <SuppliersTab 
                  suppliers={suppliers}
                  setShowSupplierForm={setShowSupplierForm}
                  setShowBomComparison={setShowBomComparison}
                  allBoms={[]} // We'll fetch BOM sends instead
                  allQuotes={[]} // We'll fetch supplier quotes
                  editSupplier={editSupplier}
                  deleteSupplier={deleteSupplier}
                />
              </Tabs.Panel>
            </Tabs>
          </Box>
        </Box>
      </Box>

      {/* BOM Creation Drawer */}
      <Drawer
        opened={showForm}
        onClose={() => setShowForm(false)}
        title=""
        position="right"
        size="xl"
        styles={{
          header: { display: 'none' },
          body: { padding: 0 }
        }}
      >
        <Box style={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa'
        }}>
          {/* Header */}
          <Box style={{ 
            padding: '32px 32px 24px 32px',
            backgroundColor: 'white',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Text style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1a1a1a',
              fontFamily: 'Poppins, sans-serif',
              marginBottom: '8px'
            }}>
              Create New BOM
            </Text>
            <Text style={{ 
              fontSize: '14px', 
              color: '#666',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Create Bill of Material
            </Text>
          </Box>

          {/* Content */}
          <Box style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '32px'
          }}>
            <Stack gap="32px">
              {/* Items Section */}
              <Paper style={{ 
                padding: '24px',
                backgroundColor: 'white',
                border: '1px solid #f0f0f0',
                borderRadius: '12px',
                boxShadow: 'none'
              }}>
                <Text style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '20px',
                  color: '#1a1a1a',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Items
                </Text>
                
                <Stack gap="16px">
                  {bomForm.items.map((item, index) => (
                    <Paper key={index} style={{ 
                      padding: '20px',
                      backgroundColor: '#f9f9f9',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px'
                    }}>
                      <Group style={{ marginBottom: '16px', alignItems: 'flex-end' }}>
                        <TextInput
                          label="Item Name"
                          placeholder="Enter item name"
                          value={item.itemName}
                          onChange={(e) => updateBomItem(index, 'itemName', e.target.value)}
                          style={{ flex: 1 }}
                          styles={{
                            label: { 
                              fontSize: '13px', 
                              fontWeight: '500', 
                              color: '#333',
                              marginBottom: '6px'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '14px',
                              padding: '10px 12px'
                            }
                          }}
                          required
                        />
                        <Select
                          label="Type"
                          value={item.itemType}
                          onChange={(value) => updateBomItem(index, 'itemType', value)}
                          data={[
                            { value: 'Raw Material', label: 'Raw Material' },
                            { value: 'Component', label: 'Component' },
                            { value: 'Packaging', label: 'Packaging' },
                            { value: 'Tool', label: 'Tool' }
                          ]}
                          style={{ minWidth: '140px' }}
                          styles={{
                            label: { 
                              fontSize: '13px', 
                              fontWeight: '500', 
                              color: '#333',
                              marginBottom: '6px'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }
                          }}
                        />
                      </Group>
                      
                      <Group style={{ alignItems: 'flex-end' }}>
                        <NumberInput
                          label="Quantity"
                          value={item.quantity}
                          onChange={(value) => updateBomItem(index, 'quantity', value || 1)}
                          min={1}
                          style={{ width: '100px' }}
                          styles={{
                            label: { 
                              fontSize: '13px', 
                              fontWeight: '500', 
                              color: '#333',
                              marginBottom: '6px'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }
                          }}
                        />
                        <Select
                          label="Unit"
                          value={item.unit}
                          onChange={(value) => updateBomItem(index, 'unit', value)}
                          data={[
                            { value: 'pieces', label: 'Pieces' },
                            { value: 'kg', label: 'Kilograms' },
                            { value: 'meters', label: 'Meters' },
                            { value: 'liters', label: 'Liters' },
                            { value: 'boxes', label: 'Boxes' }
                          ]}
                          style={{ width: '120px' }}
                          styles={{
                            label: { 
                              fontSize: '13px', 
                              fontWeight: '500', 
                              color: '#333',
                              marginBottom: '6px'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }
                          }}
                        />
                        {bomForm.items.length > 1 && (
                          <Button
                            onClick={() => removeBomItem(index)}
                            style={{ 
                              backgroundColor: 'transparent',
                              color: '#dc3545',
                              border: '1px solid #dc3545',
                              borderRadius: '6px',
                              fontSize: '12px',
                              padding: '8px 16px',
                              height: '36px'
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </Group>
                    </Paper>
                  ))}
                </Stack>
                
                <Button
                  onClick={addBomItem}
                  style={{ 
                    backgroundColor: 'transparent',
                    color: '#007bff',
                    border: '1px dashed #007bff',
                    borderRadius: '6px',
                    marginTop: '16px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  + Add Item
                </Button>
              </Paper>

              {/* Suppliers Section */}
              <Paper style={{ 
                padding: '24px',
                backgroundColor: 'white',
                border: '1px solid #f0f0f0',
                borderRadius: '12px',
                boxShadow: 'none'
              }}>
                <Text style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: '#1a1a1a',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Suppliers
                </Text>
                
                <MultiSelect
                  placeholder="Select suppliers for this BOM"
                  value={bomForm.selectedSuppliers}
                  onChange={(value) => setBomForm(prev => ({ ...prev, selectedSuppliers: value }))}
                  data={suppliers.map(supplier => ({
                    value: supplier.id,
                    label: supplier.name
                  }))}
                  styles={{
                    input: { 
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      minHeight: '42px'
                    }
                  }}
                />
              </Paper>

              {/* Details Section */}
              <Paper style={{ 
                padding: '24px',
                backgroundColor: 'white',
                border: '1px solid #f0f0f0',
                borderRadius: '12px',
                boxShadow: 'none'
              }}>
                <Text style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '20px',
                  color: '#1a1a1a',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Details
                </Text>
                
                <Stack gap="20px">
                  <TextInput
                    label="Delivery Date"
                    type="date"
                    value={bomForm.deliveryDate}
                    onChange={(e) => setBomForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '13px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '6px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        padding: '10px 12px'
                      }
                    }}
                    required
                  />
                  
                  <TextInput
                    label="Payment Terms"
                    placeholder="e.g., Net 30 days"
                    value={bomForm.paymentTerms}
                    onChange={(e) => setBomForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '13px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '6px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        padding: '10px 12px'
                      }
                    }}
                  />
                  
                  <Textarea
                    label="Notes"
                    placeholder="Additional notes or requirements"
                    value={bomForm.notes}
                    onChange={(e) => setBomForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    styles={{
                      label: { 
                        fontSize: '13px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '6px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '14px',
                        padding: '10px 12px'
                      }
                    }}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Box>

          {/* Footer */}
          <Box style={{ 
            padding: '24px 32px',
            backgroundColor: 'white',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Group style={{ justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setShowForm(false)}
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 24px'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitBOM}
                disabled={!bomForm.deliveryDate || bomForm.items.some(item => !item.itemName)}
                style={{ 
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 24px'
                }}
              >
                Create BOM
              </Button>
            </Group>
          </Box>
        </Box>
      </Drawer>

      {/* Supplier Creation/Edit Drawer */}
      <Drawer
        opened={showSupplierForm}
        onClose={() => {
          setShowSupplierForm(false);
          setEditingSupplier(null);
          setSupplierForm({
            name: '',
            email: '',
            phone: '',
            address: '',
            contactPerson: '',
            businessType: ''
          });
        }}
        title=""
        position="right"
        size="lg"
        styles={{
          header: { display: 'none' },
          body: { padding: 0 }
        }}
      >
        <Box style={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa'
        }}>
          {/* Header */}
          <Box style={{ 
            padding: '32px 32px 24px 32px',
            backgroundColor: 'white',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <Text style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              color: '#1a1a1a',
              fontFamily: 'Poppins, sans-serif',
              marginBottom: '8px'
            }}>
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </Text>
            <Text style={{ 
              fontSize: '14px', 
              color: '#666',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {editingSupplier ? "Update supplier information" : "Add a new supplier to your network"}
            </Text>
          </Box>

          {/* Content */}
          <Box style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '32px'
          }}>
            <Paper style={{ 
              padding: '32px',
              backgroundColor: 'white',
              border: '1px solid #f0f0f0',
              borderRadius: '12px',
              boxShadow: 'none'
            }}>
              <Stack gap="24px">
                <TextInput
                  label="Supplier Name"
                  placeholder="Enter supplier name"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                  styles={{
                    label: { 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#333',
                      marginBottom: '8px'
                    },
                    input: { 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px',
                      height: '48px'
                    }
                  }}
                  required
                />
                
                <Group grow>
                  <TextInput
                    label="Email"
                    type="email"
                    placeholder="supplier@example.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '8px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        height: '48px'
                      }
                    }}
                    required
                  />
                  
                  <TextInput
                    label="Phone"
                    placeholder="+1 (555) 123-4567"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '8px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        height: '48px'
                      }
                    }}
                    required
                  />
                </Group>
                
                <Textarea
                  label="Address"
                  placeholder="Enter complete address"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  styles={{
                    label: { 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#333',
                      marginBottom: '8px'
                    },
                    input: { 
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      padding: '12px 16px'
                    }
                  }}
                />
                
                <Group grow>
                  <TextInput
                    label="Contact Person"
                    placeholder="Primary contact name"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '8px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        padding: '12px 16px',
                        height: '48px'
                      }
                    }}
                  />
                  
                  <Select
                    label="Business Type"
                    placeholder="Select business type"
                    value={supplierForm.businessType}
                    onChange={(value) => setSupplierForm(prev => ({ ...prev, businessType: value || '' }))}
                    data={[
                      { value: 'Manufacturer', label: 'Manufacturer' },
                      { value: 'Distributor', label: 'Distributor' },
                      { value: 'Wholesaler', label: 'Wholesaler' },
                      { value: 'Service Provider', label: 'Service Provider' }
                    ]}
                    styles={{
                      label: { 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#333',
                        marginBottom: '8px'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        height: '48px'
                      }
                    }}
                  />
                </Group>
              </Stack>
            </Paper>
          </Box>

          {/* Footer */}
          <Box style={{ 
            padding: '24px 32px',
            backgroundColor: 'white',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Group style={{ justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                  setSupplierForm({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    contactPerson: '',
                    businessType: ''
                  });
                }}
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 24px'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSupplier}
                disabled={!supplierForm.name || !supplierForm.email || !supplierForm.phone}
                style={{ 
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '10px 24px'
                }}
              >
                {editingSupplier ? 'Update' : 'Create'} Supplier
              </Button>
            </Group>
          </Box>
        </Box>
      </Drawer>

      {/* BOM Comparison Modal */}
      <Modal
        opened={showBomComparison}
        onClose={() => setShowBomComparison(false)}
        title="Compare BOM Quotes"
        size="xl"
        styles={{
          header: { backgroundColor: 'white', borderBottom: '1px solid #f0f0f0', padding: '24px 32px 16px 32px' },
          title: { fontSize: '20px', fontWeight: '500', color: '#1a1a1a', fontFamily: 'Poppins, sans-serif' },
          body: { padding: '24px 32px' }
        }}
      >
        <Box>
          {(() => {
            // Group bomRates by bomId
            const grouped: {[bomId: string]: any[]} = {};
            bomRates.forEach((rate: any) => {
              if (!grouped[rate.bomId]) grouped[rate.bomId] = [];
              grouped[rate.bomId].push(rate);
            });
            const bomIds = Object.keys(grouped);
            if (bomIds.length === 0) {
              return <Text style={{ color: "#999", fontFamily: "Poppins, sans-serif" }}>No quotes available yet. Add quotes from the BOM details view.</Text>;
            }
            return bomIds.map(bomId => {
              const quotes = grouped[bomId];
              const bom = orders.find((o: any) => o.id === bomId);
              const sorted = [...quotes].filter(q => q.totalAmount > 0).sort((a, b) => a.totalAmount - b.totalAmount);
              const best = sorted[0];
              return (
                <div key={bomId} style={{ marginBottom: "32px", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ backgroundColor: "#f8f9fa", padding: "14px 20px", borderBottom: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={{ fontWeight: "700", fontSize: "15px", fontFamily: "Poppins, sans-serif" }}>{bom?.poNumber || bomId}</Text>
                    <Text style={{ fontSize: "12px", color: "#666" }}>{quotes.length} quote{quotes.length !== 1 ? 's' : ''}</Text>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f0f0f0" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", fontFamily: "Poppins, sans-serif" }}>Supplier</th>
                          {bom?.items?.map((item: any) => (
                            <th key={item.itemName} style={{ padding: "10px 14px", textAlign: "right", fontFamily: "Poppins, sans-serif" }}>{item.itemName}</th>
                          ))}
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>Transport</th>
                          <th style={{ padding: "10px 14px", textAlign: "right" }}>Tax</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700" }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((q: any, i: number) => (
                          <tr key={i} style={{ backgroundColor: q === best ? "#f0fff4" : "white", borderTop: "1px solid #f0f0f0" }}>
                            <td style={{ padding: "10px 14px", fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                              {q.supplierName}
                              {q === best && <Badge color="green" size="xs" style={{ marginLeft: "6px" }}>Best</Badge>}
                            </td>
                            {bom?.items?.map((item: any) => {
                              const rate = q.itemRates?.[item.itemName];
                              return (
                                <td key={item.itemName} style={{ padding: "10px 14px", textAlign: "right", color: "#333" }}>
                                  {rate ? `PKR ${rate.unitPrice?.toLocaleString()}/unit` : <span style={{ color: "#ccc" }}>—</span>}
                                </td>
                              );
                            })}
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#666" }}>PKR {(q.transportCost || 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", color: "#666" }}>PKR {(q.tax || 0).toLocaleString()}</td>
                            <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: q === best ? "#28a745" : "#333" }}>
                              PKR {q.totalAmount?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {best.notes && <Text style={{ padding: "8px 14px", fontSize: "12px", color: "#888", fontStyle: "italic" }}>{best.notes}</Text>}
                </div>
              );
            });
          })()}
        </Box>
      </Modal>

      {/* BOM Details Modal */}
      <Modal
        opened={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setSelectedPO(null);
        }}
        title="BOM Details"
        size="xl"
      >
        {selectedPO && (
          <BOMDetailsView
            bom={selectedPO}
            bomRates={bomRates}
            onClose={() => {
              setShowApprovalModal(false);
              setSelectedPO(null);
            }}
            onQuoteAdded={fetchBOMRates}
            onSentToFinance={async () => {
              const res = await fetch('/api/finance/bom-invoices');
              const invoices = await res.json();
              const statusMap: {[key: string]: boolean} = {};
              orders.forEach(order => {
                const existing = invoices.find((inv: any) => inv.bomId === order.id);
                statusMap[order.id] = !!existing;
              });
              setBomFinanceStatus(statusMap);
              setShowApprovalModal(false);
              setSelectedPO(null);
            }}
          />
        )}
      </Modal>

      <LogoutButton />
    </ProtectedRoute>
  );
}

// BOM Details View Component
function BOMDetailsView({
  bom,
  bomRates,
  onClose,
  onQuoteAdded,
  onSentToFinance,
}: {
  bom: any;
  bomRates: any[];
  onClose: () => void;
  onQuoteAdded?: () => void;
  onSentToFinance?: () => void;
}) {
  const [isSentToFinance, setIsSentToFinance] = useState(false);
  const [showSendToSupplier, setShowSendToSupplier] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [sentSupplierIds, setSentSupplierIds] = useState<string[]>([]);
  const [quoteSupplier, setQuoteSupplier] = useState('');
  const [itemRates, setItemRates] = useState<{[key: string]: number}>({});
  const [transportCost, setTransportCost] = useState(0);
  const [tax, setTax] = useState(0);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [submittingQuote, setSubmittingQuote] = useState(false);

  useEffect(() => {
    fetch("/api/suppliers").then(r => r.json()).then(setSuppliers).catch(() => {});
    fetch(`/api/bom-sends`).then(r => r.json()).then((sends: any[]) => {
      const already = sends.filter((s: any) => s.bom_id === bom.id || s.bomId === bom.id).map((s: any) => s.supplier_id || s.supplierId);
      setSentSupplierIds(already);
    }).catch(() => {});
  }, [bom.id]);

  const handleSendToSuppliers = async () => {
    if (selectedSupplierIds.length === 0) return;
    setSending(true);
    try {
      await Promise.all(selectedSupplierIds.map(supplierId => {
        const supplier = suppliers.find((s: any) => s.id === supplierId);
        return fetch('/api/bom-sends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bomId: bom.id,
            bomNumber: bom.poNumber || bom.po_number,
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierPhone: supplier.phone || '',
            items: bom.items,
          }),
        });
      }));
      setSentSupplierIds(prev => [...prev, ...selectedSupplierIds]);
      setSelectedSupplierIds([]);
      setShowSendToSupplier(false);
      alert('BOM sent to supplier(s) successfully!');
    } catch (e) {
      alert('Failed to send BOM to suppliers');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitQuote = async () => {
    if (!quoteSupplier) { alert('Please select a supplier'); return; }
    const supplier = suppliers.find((s: any) => s.id === quoteSupplier);
    const itemsSubtotal = bom.items?.reduce((sum: number, item: any) => {
      const rate = itemRates[item.itemName] || 0;
      return sum + rate * item.quantity;
    }, 0) || 0;
    const totalAmount = itemsSubtotal + transportCost + tax;

    const itemRatesFormatted: any = {};
    bom.items?.forEach((item: any) => {
      const unitPrice = itemRates[item.itemName] || 0;
      itemRatesFormatted[item.itemName] = { unitPrice, totalPrice: unitPrice * item.quantity };
    });

    setSubmittingQuote(true);
    try {
      const res = await fetch('/api/bom-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bomId: bom.id,
          bomNumber: bom.poNumber || bom.po_number,
          supplierId: supplier?.id,
          supplierName: supplier?.name,
          itemRates: itemRatesFormatted,
          transportCost,
          tax,
          totalAmount,
          notes: quoteNotes,
          status: 'submitted',
        }),
      });
      if (res.ok) {
        alert('Quote added successfully!');
        setShowAddQuote(false);
        setQuoteSupplier('');
        setItemRates({});
        setTransportCost(0);
        setTax(0);
        setQuoteNotes('');
        onQuoteAdded?.();
      } else {
        alert('Failed to add quote');
      }
    } catch (e) {
      alert('Error adding quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Get all rates for this BOM
  const bomQuotes = bomRates.filter(rate => rate.bomId === bom.id);
  const validQuotes = bomQuotes.filter(q => q.totalAmount > 0);
  const bestQuote = validQuotes.length > 0 ? validQuotes.sort((a, b) => a.totalAmount - b.totalAmount)[0] : null;
  const suppliersWithQuotes = new Set(bomQuotes.map((q: any) => q.supplierId));

  // Check if BOM is already sent to finance
  useEffect(() => {
    const checkFinanceStatus = async () => {
      try {
        const res = await fetch('/api/finance/bom-invoices');
        const invoices = await res.json();
        const existingInvoice = invoices.find((invoice: any) => invoice.bomId === bom.id);
        setIsSentToFinance(!!existingInvoice);
      } catch (error) {
        console.error('Error checking finance status:', error);
      }
    };
    
    checkFinanceStatus();
  }, [bom.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "gray";
      case "pending_approval": return "yellow";
      case "approved": return "green";
      case "rejected": return "red";
      case "sent_to_supplier": return "blue";
      case "sent_to_finance": return "purple";
      case "completed": return "teal";
      default: return "gray";
    }
  };

  return (
    <div style={{ height: "70vh", display: "flex", flexDirection: "column" }}>
      {/* Header Section */}
      <div style={{ 
        padding: "20px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: "24px", 
              fontWeight: "700", 
              color: "#212529",
              fontFamily: "Poppins, sans-serif",
              marginBottom: "12px"
            }}>
              {bom.poNumber}
            </Text>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
              <div>
                <Text style={{ fontSize: "12px", color: "#6c757d", fontFamily: "Poppins, sans-serif", textTransform: "uppercase" }}>
                  Created By
                </Text>
                <Text style={{ fontSize: "14px", fontWeight: "600", color: "#495057", fontFamily: "Poppins, sans-serif" }}>
                  {bom.createdBy}
                </Text>
              </div>
              <div>
                <Text style={{ fontSize: "12px", color: "#6c757d", fontFamily: "Poppins, sans-serif", textTransform: "uppercase" }}>
                  Delivery Date
                </Text>
                <Text style={{ fontSize: "14px", fontWeight: "600", color: "#495057", fontFamily: "Poppins, sans-serif" }}>
                  {new Date(bom.deliveryDate).toLocaleDateString()}
                </Text>
              </div>
              <div>
                <Text style={{ fontSize: "12px", color: "#6c757d", fontFamily: "Poppins, sans-serif", textTransform: "uppercase" }}>
                  Status
                </Text>
                <Badge color={getStatusColor(bom.status)} style={{ marginTop: "6px" }}>
                  {bom.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </div>
          
          {bomQuotes.length > 0 && (
            <div style={{ 
              padding: "16px", 
              backgroundColor: "#e8f5e8", 
              borderRadius: "8px",
              textAlign: "center",
              minWidth: "150px"
            }}>
              <Text style={{ fontSize: "12px", color: "#155724", fontFamily: "Poppins, sans-serif" }}>
                {bomQuotes.length} Quote{bomQuotes.length > 1 ? 's' : ''} Received
              </Text>
              {bestQuote ? (
                <>
                  <Text style={{ fontSize: "18px", fontWeight: "700", color: "#155724", fontFamily: "Poppins, sans-serif" }}>
                    Best: PKR {bestQuote?.totalAmount.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: "10px", color: "#155724", fontFamily: "Poppins, sans-serif" }}>
                    by {bestQuote?.supplierName}
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: "13px", color: "#155724", fontFamily: "Poppins, sans-serif" }}>No valid quotes yet</Text>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <Text style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          marginBottom: "15px", 
          fontFamily: "Poppins, sans-serif"
        }}>
          Items ({bom.items?.length || 0})
        </Text>
        
        {bom.items && bom.items.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Quantity</Table.Th>
                <Table.Th>Unit</Table.Th>
                {bestQuote && <Table.Th>Best Quote Price</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {bom.items.map((item: any) => {
                const itemRate = bestQuote?.itemRates?.[item.id];
                return (
                  <Table.Tr key={item.id}>
                    <Table.Td>
                      <Text style={{ fontWeight: "500" }}>{item.itemName}</Text>
                    </Table.Td>
                    <Table.Td>{item.itemType}</Table.Td>
                    <Table.Td>{item.quantity}</Table.Td>
                    <Table.Td>{item.unit}</Table.Td>
                    {bestQuote && (
                      <Table.Td>
                        {itemRate ? (
                          <div>
                            <Text style={{ fontSize: "14px", fontWeight: "600", color: "#28a745" }}>
                              PKR {itemRate.unitPrice?.toLocaleString()} / {item.unit}
                            </Text>
                            <Text style={{ fontSize: "12px", color: "#6c757d" }}>
                              Total: PKR {itemRate.totalPrice?.toLocaleString()}
                            </Text>
                          </div>
                        ) : (
                          <Text style={{ fontSize: "12px", color: "#999" }}>No quote</Text>
                        )}
                      </Table.Td>
                    )}
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        ) : (
          <Text style={{ color: "#999", fontSize: "14px" }}>No items in this BOM.</Text>
        )}
      </div>

      {/* Existing Quotes Section */}
      {bomQuotes.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <Text style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px", fontFamily: "Poppins, sans-serif" }}>
            Quotes Received ({bomQuotes.length})
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {bomQuotes.map((q: any, i: number) => (
              <div key={i} style={{ border: "1px solid #e0e0e0", borderRadius: "8px", padding: "14px", backgroundColor: bestQuote === q ? "#f0fff4" : "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <Text style={{ fontWeight: "600", fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>{q.supplierName}</Text>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {bestQuote === q && <Badge color="green" size="sm">Best Price</Badge>}
                    <Text style={{ fontWeight: "700", fontSize: "15px", color: "#28a745", fontFamily: "Poppins, sans-serif" }}>PKR {q.totalAmount?.toLocaleString()}</Text>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {Object.entries(q.itemRates || {}).map(([itemName, rate]: [string, any]) => (
                    <Text key={itemName} style={{ fontSize: "12px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                      {itemName}: PKR {rate.unitPrice}/unit
                    </Text>
                  ))}
                  {q.transportCost > 0 && <Text style={{ fontSize: "12px", color: "#666" }}>Transport: PKR {q.transportCost}</Text>}
                  {q.tax > 0 && <Text style={{ fontSize: "12px", color: "#666" }}>Tax: PKR {q.tax}</Text>}
                </div>
                {q.notes && <Text style={{ fontSize: "12px", color: "#888", marginTop: "6px", fontStyle: "italic" }}>{q.notes}</Text>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Quote Form */}
      {showAddQuote && (
        <div style={{ marginTop: "20px", border: "1px solid #0066cc", borderRadius: "8px", padding: "20px", backgroundColor: "#f8f9ff" }}>
          <Text style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px", fontFamily: "Poppins, sans-serif" }}>Add Quote</Text>
          <div style={{ marginBottom: "12px" }}>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Supplier *</Text>
            <select value={quoteSupplier} onChange={e => setQuoteSupplier(e.target.value)} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}>
              <option value="">Select supplier...</option>
              {suppliers.filter((s: any) => !suppliersWithQuotes.has(s.id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Text style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>Unit Price per Item (PKR)</Text>
          {bom.items?.map((item: any) => (
            <div key={item.itemName} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Text style={{ fontSize: "13px", minWidth: "140px", fontFamily: "Poppins, sans-serif" }}>{item.itemName} (×{item.quantity})</Text>
              <input
                type="number"
                min={0}
                placeholder="Unit price"
                value={itemRates[item.itemName] || ''}
                onChange={e => setItemRates(prev => ({ ...prev, [item.itemName]: parseFloat(e.target.value) || 0 }))}
                style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", width: "130px" }}
              />
              <Text style={{ fontSize: "12px", color: "#888" }}>= PKR {((itemRates[item.itemName] || 0) * item.quantity).toLocaleString()}</Text>
            </div>
          ))}
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", marginBottom: "12px" }}>
            <div>
              <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Transport Cost</Text>
              <input type="number" min={0} value={transportCost} onChange={e => setTransportCost(parseFloat(e.target.value) || 0)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", width: "120px" }} />
            </div>
            <div>
              <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Tax</Text>
              <input type="number" min={0} value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", width: "120px" }} />
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <Text style={{ fontSize: "13px", fontWeight: "700", color: "#0066cc" }}>
                Total: PKR {(bom.items?.reduce((s: number, item: any) => s + (itemRates[item.itemName] || 0) * item.quantity, 0) + transportCost + tax).toLocaleString()}
              </Text>
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Notes</Text>
            <textarea value={quoteNotes} onChange={e => setQuoteNotes(e.target.value)} rows={2} style={{ width: "100%", padding: "8px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", resize: "vertical" }} />
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button onClick={() => setShowAddQuote(false)} style={{ backgroundColor: "transparent", color: "#666", border: "1px solid #ddd" }}>Cancel</Button>
            <Button onClick={handleSubmitQuote} disabled={submittingQuote} style={{ backgroundColor: "#0066cc", color: "white" }}>
              {submittingQuote ? "Saving..." : "Save Quote"}
            </Button>
          </div>
        </div>
      )}
      {/* Action Buttons */}
      <div style={{ 
        padding: "20px 0", 
        borderTop: "1px solid #e9ecef",
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          {validQuotes.length > 0 && (
            <Text style={{ fontSize: "14px", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>
              {validQuotes.length} quote{validQuotes.length > 1 ? 's' : ''} received • Best price: PKR {bestQuote?.totalAmount.toLocaleString()}
            </Text>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              color: "#6c757d",
              border: "1px solid #dee2e6"
            }}
          >
            Close
          </Button>

          {/* Send to Supplier Button */}
          {bom.status === 'approved' && (
            <Button
              onClick={() => setShowSendToSupplier(true)}
              style={{ backgroundColor: "#0066cc", color: "white", fontFamily: "Poppins, sans-serif", fontWeight: "600" }}
            >
              Send to Supplier
            </Button>
          )}

          {/* Add Quote Button */}
          {(bom.status === 'approved' || bom.status === 'sent_to_supplier') && suppliers.filter((s: any) => !suppliersWithQuotes.has(s.id)).length > 0 && (
            <Button
              onClick={() => setShowAddQuote(v => !v)}
              style={{ backgroundColor: showAddQuote ? "#6c757d" : "#6f42c1", color: "white", fontFamily: "Poppins, sans-serif", fontWeight: "600" }}
            >
              {showAddQuote ? "Cancel Quote" : "+ Add Quote"}
            </Button>
          )}

          {bestQuote && (bom.status === 'approved' || bom.status === 'sent_to_supplier') && !isSentToFinance && (
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/finance/bom-invoices', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      bomId: bom.id,
                      bomData: bom,
                      bestQuote: bestQuote,
                      status: 'pending'
                    }),
                  });
                  
                  if (response.ok) {
                    alert('BOM sent to Finance successfully!');
                    setIsSentToFinance(true);
                    onSentToFinance?.();
                    onClose();
                  } else {
                    alert('Failed to send BOM to Finance');
                  }
                } catch (error) {
                  console.error('Error sending BOM to Finance:', error);
                  alert('Error sending BOM to Finance');
                }
              }}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                fontFamily: "Poppins, sans-serif",
                fontWeight: "600"
              }}
            >
              Send to Finance
            </Button>
          )}
          {isSentToFinance && (
            <Button
              disabled
              style={{
                backgroundColor: "#6c757d",
                color: "white",
                fontFamily: "Poppins, sans-serif",
                opacity: 0.6
              }}
            >
              Already Sent to Finance
            </Button>
          )}
        </div>
      </div>

      {/* Send to Supplier Modal */}
      {showSendToSupplier && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "white", borderRadius: "8px", padding: "24px", width: "420px", maxHeight: "80vh", overflowY: "auto" }}>
            <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", fontFamily: "Poppins, sans-serif" }}>
              Send BOM to Suppliers
            </Text>
            <Text style={{ fontSize: "13px", color: "#666", marginBottom: "16px", fontFamily: "Poppins, sans-serif" }}>
              Select suppliers to send <strong>{bom.poNumber || bom.po_number}</strong> to:
            </Text>
            {suppliers.length === 0 ? (
              <Text style={{ color: "#999", fontSize: "13px" }}>No suppliers found. Add suppliers first.</Text>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {suppliers.map((s: any) => {
                  const alreadySent = sentSupplierIds.includes(s.id);
                  const isSelected = selectedSupplierIds.includes(s.id);
                  return (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: `1px solid ${isSelected ? "#0066cc" : "#e0e0e0"}`, borderRadius: "6px", cursor: alreadySent ? "not-allowed" : "pointer", backgroundColor: alreadySent ? "#f5f5f5" : isSelected ? "#e8f0fe" : "white", opacity: alreadySent ? 0.6 : 1 }}>
                      <input
                        type="checkbox"
                        disabled={alreadySent}
                        checked={isSelected}
                        onChange={() => {
                          if (alreadySent) return;
                          setSelectedSupplierIds(prev => isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]);
                        }}
                      />
                      <div>
                        <Text style={{ fontSize: "13px", fontWeight: "500", fontFamily: "Poppins, sans-serif" }}>{s.name}</Text>
                        <Text style={{ fontSize: "11px", color: "#888", fontFamily: "Poppins, sans-serif" }}>{s.email || s.phone || ''}{alreadySent ? ' • Already sent' : ''}</Text>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button onClick={() => { setShowSendToSupplier(false); setSelectedSupplierIds([]); }} style={{ backgroundColor: "transparent", color: "#666", border: "1px solid #dee2e6" }}>
                Cancel
              </Button>
              <Button
                onClick={handleSendToSuppliers}
                disabled={selectedSupplierIds.length === 0 || sending}
                style={{ backgroundColor: "#0066cc", color: "white", fontFamily: "Poppins, sans-serif" }}
              >
                {sending ? "Sending..." : `Send to ${selectedSupplierIds.length} Supplier${selectedSupplierIds.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}