"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Tabs, Table, Badge, Modal, Textarea } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LogoutButton } from "@/components/LogoutButton";

const downloadDepartureReportPDF = async (order: any, client: any) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const right = pageWidth - 14;

  // Header bar
  doc.setFillColor(20, 20, 20);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DEPARTURE REPORT", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Order #: ${order.po_number || order.id.slice(0, 8)}`, right, 12, { align: "right" });
  doc.text(`Date: ${new Date(order.fulfilled_at).toLocaleDateString()}`, right, 20, { align: "right" });

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Client / Order Info
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CLIENT INFORMATION", 14, 38);
  doc.text("ORDER INFORMATION", pageWidth / 2 + 5, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(client?.name || order.client_name || "N/A", 14, 46);
  if (client?.email) doc.text(client.email, 14, 53);
  if (client?.phone) doc.text(client.phone, 14, 60);
  if (client?.address) doc.text(client.address, 14, 67, { maxWidth: pageWidth / 2 - 20 });

  doc.text(`Product: ${order.product_name}`, pageWidth / 2 + 5, 46);
  doc.text(`Quantity: ${order.quantity} ${order.unit}`, pageWidth / 2 + 5, 53);
  doc.text(`Fulfilled By: ${order.fulfilled_by}`, pageWidth / 2 + 5, 60);
  doc.text(`Fulfilled Date: ${new Date(order.fulfilled_at).toLocaleString()}`, pageWidth / 2 + 5, 67);

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 75, right, 75);

  // Order Details Table
  autoTable(doc, {
    startY: 82,
    head: [["Description", "Quantity", "Unit Price", "Tax", "Transport", "Other", "Total"]],
    body: [[
      order.product_name,
      `${order.quantity} ${order.unit}`,
      `PKR ${Number(order.unit_price || 0).toLocaleString()}`,
      `PKR ${Number(order.tax || 0).toLocaleString()}`,
      `PKR ${Number(order.transport || 0).toLocaleString()}`,
      `PKR ${Number(order.other_charges || 0).toLocaleString()}`,
      `PKR ${Number(order.total_price).toLocaleString()}`
    ]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 6: { halign: "right", fontStyle: "bold" } },
  });

  // Payment Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - 90;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const subtotal = Number(order.unit_price || 0) * order.quantity;
  doc.text("Subtotal:", summaryX, finalY);
  doc.text(`PKR ${subtotal.toLocaleString()}`, right, finalY, { align: "right" });

  if (order.tax > 0) {
    doc.text("Tax:", summaryX, finalY + 8);
    doc.text(`PKR ${Number(order.tax).toLocaleString()}`, right, finalY + 8, { align: "right" });
  }
  if (order.transport > 0) {
    doc.text("Transport:", summaryX, finalY + 16);
    doc.text(`PKR ${Number(order.transport).toLocaleString()}`, right, finalY + 16, { align: "right" });
  }
  if (order.other_charges > 0) {
    doc.text("Other Charges:", summaryX, finalY + 24);
    doc.text(`PKR ${Number(order.other_charges).toLocaleString()}`, right, finalY + 24, { align: "right" });
  }

  const totalY = finalY + 32;
  doc.setDrawColor(0, 0, 0);
  doc.line(summaryX, totalY - 4, right, totalY - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL:", summaryX, totalY + 2);
  doc.text(`PKR ${Number(order.total_price).toLocaleString()}`, right, totalY + 2, { align: "right" });

  // Payment Info
  if (order.payment_method) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Payment Method: ${order.payment_method.replace('_', ' ').toUpperCase()}`, summaryX, totalY + 12);
    doc.text(`Payment Confirmed: ${new Date(order.payment_confirmed_at).toLocaleDateString()}`, summaryX, totalY + 18);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("This is a system-generated departure report.", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  doc.save(`Departure-Report-${order.po_number || order.id.slice(0, 8)}-${Date.now()}.pdf`);
};

const downloadReceivingPDF = async (record: any) => {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Goods Receiving Note", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`BOM Number: ${record.bomNumber}`, 14, 35);
  doc.text(`Supplier: ${record.supplierName || 'N/A'}`, 14, 43);
  doc.text(`Received By: ${record.receivedBy}`, 14, 51);
  doc.text(`Received Date: ${new Date(record.receivedDate).toLocaleString()}`, 14, 59);
  if (record.notes) doc.text(`Notes: ${record.notes}`, 14, 67);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 72, pageWidth - 14, 72);

  // Items table
  autoTable(doc, {
    startY: 78,
    head: [["Item Name", "Type", "Expected Qty", "Received Qty", "Variance", "Unit"]],
    body: record.items?.map((item: any) => {
      const expected = item.expectedQuantity ?? item.quantity;
      const received = item.receivedQuantity ?? item.quantity;
      const variance = received - expected;
      return [
        item.itemName,
        item.itemType,
        expected,
        received,
        variance === 0 ? "Exact" : variance > 0 ? `+${variance} extra` : `${variance} short`,
        item.unit,
      ];
    }) || [],
    styles: { fontSize: 10, fontStyle: "normal" },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`GRN-${record.bomNumber}-${Date.now()}.pdf`);
};
interface PendingReceiving {
  id: string;
  bomNumber: string;
  bomData: any;
  bestQuote: any;
  supplierName: string;
  totalAmount: number;
  deliveryDate: string;
  createdAt: string;
}

interface ReceivingRecord {
  id: string;
  bomInvoiceId: string;
  bomNumber: string;
  items: any[];
  receivedBy: string;
  receivedDate: string;
  notes: string;
  status: string;
}

export default function Inventory() {
  const [currentPage, setCurrentPage] = useState(3);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>('receiving');
  const [pendingReceiving, setPendingReceiving] = useState<PendingReceiving[]>([]);
  const [receivingRecords, setReceivingRecords] = useState<ReceivingRecord[]>([]);
  const [selectedBom, setSelectedBom] = useState<PendingReceiving | null>(null);
  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [receivedQtys, setReceivedQtys] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchNotifications();
    fetchPendingReceiving();
    fetchReceivingRecords();
    fetchProducts();
    fetchClientOrders();
    fetchClients();
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

  const fetchPendingReceiving = async () => {
    try {
      const res = await fetch("/api/inventory/pending-receiving");
      const data = await res.json();
      setPendingReceiving(data);
    } catch (error) {
      console.error("Error fetching pending receiving:", error);
    }
  };

  const fetchReceivingRecords = async () => {
    try {
      const res = await fetch("/api/inventory/receiving");
      const data = await res.json();
      setReceivingRecords(data);
    } catch (error) {
      console.error("Error fetching receiving records:", error);
    }
  };

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState<any>(null);
  const [showProductHistory, setShowProductHistory] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [productHistory, setProductHistory] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', specification: '', category: '', price: 0, stock: 0, unit: 'pieces' });
  const [productImages, setProductImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [stockAdjust, setStockAdjust] = useState<number>(0);
  const [stockAdjustNote, setStockAdjustNote] = useState('');
  const [newPrice, setNewPrice] = useState<number>(0);
  const [clientOrders, setClientOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientOrder, setSelectedClientOrder] = useState<any>(null);
  const [showClientOrderModal, setShowClientOrderModal] = useState(false);

  const getBOMType = (bomData: any) => {
    if (!bomData.items || bomData.items.length === 0) return 'Unknown';
    const itemTypes = [...new Set(bomData.items.map((item: any) => item.itemType))] as string[];
    if (itemTypes.length === 1) return itemTypes[0] as string;
    return itemTypes.join(' & ');
  };

  // For received records, list under each unique itemType present
  const allItemTypes = ['Raw Material', 'Component', 'Packaging', 'Finished Good'];

  const categorizedPendingReceiving = {
    'Raw Material': pendingReceiving.filter(bom => bom.bomData?.items?.some((i: any) => i.itemType === 'Raw Material')),
    'Component': pendingReceiving.filter(bom => bom.bomData?.items?.some((i: any) => i.itemType === 'Component')),
    'Packaging': pendingReceiving.filter(bom => bom.bomData?.items?.some((i: any) => i.itemType === 'Packaging')),
    'Other': pendingReceiving.filter(bom => bom.bomData?.items?.every((i: any) => !['Raw Material','Component','Packaging'].includes(i.itemType))),
  };

  const categorizedReceivingRecords = {
    'Raw Material': receivingRecords.filter(r => r.items?.some((i: any) => i.itemType === 'Raw Material')),
    'Component': receivingRecords.filter(r => r.items?.some((i: any) => i.itemType === 'Component')),
    'Packaging': receivingRecords.filter(r => r.items?.some((i: any) => i.itemType === 'Packaging')),
    'Other': receivingRecords.filter(r => r.items?.every((i: any) => !['Raw Material','Component','Packaging'].includes(i.itemType))),
  };

  const renderCategorizedTable = (categorizedData: any, showActions: boolean = false, isReceived: boolean = false) => {
    const categories = Object.keys(categorizedData).filter(category => categorizedData[category].length > 0);
    
    if (categories.length === 0) {
      return (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          color: "#6c757d",
          fontFamily: "Poppins, sans-serif"
        }}>
          {isReceived ? "No items received yet" : "No items pending receiving"}
        </div>
      );
    }

    return (
      <Tabs defaultValue={categories[0]}>
        <Tabs.List>
          {categories.map(category => (
            <Tabs.Tab key={category} value={category}>
              {category} ({categorizedData[category].length})
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {categories.map(category => (
          <Tabs.Panel key={category} value={category} pt="md">
            <div style={{ 
              backgroundColor: "#fff", 
              border: "1px solid #e9ecef", 
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>BOM Number</Table.Th>
                    <Table.Th>{isReceived ? 'Items Received' : 'Supplier'}</Table.Th>
                    <Table.Th>{isReceived ? 'Received By' : 'Items Count'}</Table.Th>
                    <Table.Th>{isReceived ? 'Received Date' : 'Total Amount'}</Table.Th>
                    <Table.Th>{isReceived ? 'Status' : 'Expected Delivery'}</Table.Th>
                    <Table.Th>{isReceived ? 'Notes' : 'Status'}</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {categorizedData[category].map((item: any) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <div>
                          <Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                            {isReceived ? item.bomNumber : item.bomNumber}
                          </Text>
                          <Text style={{ fontSize: "12px", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>
                            Type: {category}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                          {isReceived ? `${item.items.length} items` : item.supplierName}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                          {isReceived ? item.receivedBy : `${item.bomData.items.length} items`}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text style={{ fontWeight: "600", color: isReceived ? "#212529" : "#28a745", fontFamily: "Poppins, sans-serif" }}>
                          {isReceived ? 
                            `${new Date(item.receivedDate).toLocaleDateString()} ${new Date(item.receivedDate).toLocaleTimeString()}` :
                            `PKR ${item.totalAmount.toLocaleString()}`
                          }
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        {isReceived ? (
                          <Badge color="green">Received</Badge>
                        ) : (
                          <Text style={{ fontFamily: "Poppins, sans-serif" }}>
                            {new Date(item.deliveryDate).toLocaleDateString()}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {isReceived ? (
                          <Text style={{ fontFamily: "Poppins, sans-serif", fontSize: "12px" }}>
                            {item.notes || 'No notes'}
                          </Text>
                        ) : (
                          <Badge color="blue">Awaiting Delivery</Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {isReceived ? (
                          <Button
                            size="xs"
                            onClick={() => {
                              setSelectedRecord(item);
                              setShowRecordModal(true);
                            }}
                            style={{ backgroundColor: "#007bff", fontFamily: "Poppins, sans-serif" }}
                          >
                            View
                          </Button>
                        ) : (
                          <Button
                            size="xs"
                            onClick={() => {
                              setSelectedBom(item);
                              // Pre-fill received quantities with expected quantities
                              const qtys: {[key: string]: number} = {};
                              item.bomData.items.forEach((i: any) => { qtys[i.itemName] = i.quantity; });
                              setReceivedQtys(qtys);
                              setShowReceivingModal(true);
                            }}
                            style={{
                              backgroundColor: "#28a745",
                              fontFamily: "Poppins, sans-serif"
                            }}
                          >
                            Receive Items
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    );
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (e) { console.error(e); }
  };

  const fetchClientOrders = async () => {
    try {
      const res = await fetch("/api/crm/orders");
      const data = await res.json();
      setClientOrders(data.filter((o: any) => o.status === "payment_confirmed" || o.status === "fulfilled"));
    } catch (error) {
      console.error("Error fetching client orders:", error);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/crm/clients");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append("files", f));
    const res = await fetch("/api/products/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { urls } = await res.json();
      setProductImages(prev => [...prev, ...urls]);
    } else { alert("Image upload failed"); }
    setUploadingImages(false);
  };

  const submitProduct = async () => {
    if (!productForm.name) { alert('Name is required'); return; }
    const method = editingProduct ? 'PUT' : 'POST';
    // When editing: only send editable fields (no stock/price/unit)
    const body = editingProduct
      ? { id: editingProduct.id, name: productForm.name, description: productForm.description, specification: productForm.specification, category: productForm.category, images: productImages, updatedBy: currentUser?.username }
      : { ...productForm, images: productImages, createdBy: currentUser?.username };
    const res = await fetch('/api/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowProductForm(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', specification: '', category: '', price: 0, stock: 0, unit: 'pieces' });
      setProductImages([]);
      fetchProducts();
    } else { alert('Failed to save product'); }
  };

  const openHistory = async (product?: any) => {
    setSelectedProduct(product || null);
    const url = product ? `/api/products/history?productId=${product.id}` : '/api/products/history';
    const res = await fetch(url);
    const data = await res.json();
    setProductHistory(data);
    setShowProductHistory(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, deletedBy: currentUser?.username }) });
    fetchProducts();
    // Refresh history if open
    if (showProductHistory) openHistory(selectedProduct || undefined);
  };

  const handleReceiveItems = async () => {
    if (!selectedBom) return;
    
    try {
      const res = await fetch("/api/inventory/receiving", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bomInvoiceId: selectedBom.id,
          bomNumber: selectedBom.bomNumber,
          items: selectedBom.bomData.items.map((item: any) => ({
            ...item,
            receivedQuantity: receivedQtys[item.itemName] ?? item.quantity,
            expectedQuantity: item.quantity,
            variance: (receivedQtys[item.itemName] ?? item.quantity) - item.quantity,
          })),
          receivedBy: currentUser?.username || 'unknown',
          notes: receivingNotes
        }),
      });
      
      if (res.ok) {
        alert('Items received successfully!');
        setShowReceivingModal(false);
        setSelectedBom(null);
        setReceivingNotes('');
        setReceivedQtys({});
        fetchPendingReceiving();
        fetchReceivingRecords();
      } else {
        alert('Failed to receive items');
      }
    } catch (error) {
      console.error("Error receiving items:", error);
      alert('Error receiving items');
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

            <Box style={{ paddingTop: "20px" }}>
              <Text style={{ fontSize: "24px", fontWeight: "600", marginBottom: "20px", fontFamily: "Poppins, sans-serif" }}>
                Inventory Management
              </Text>
              
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                  <Tabs.Tab value="receiving">Receiving</Tabs.Tab>
                  <Tabs.Tab value="products">Products</Tabs.Tab>
                  <Tabs.Tab value="client-orders">Client Orders</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="receiving" pt="md">
                  <Tabs defaultValue="pending">
                    <Tabs.List>
                      <Tabs.Tab value="pending">
                        Pending Receiving ({pendingReceiving.length})
                      </Tabs.Tab>
                      <Tabs.Tab value="completed">
                        Received Items ({receivingRecords.length})
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="pending" pt="md">
                      {pendingReceiving.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>No items pending receiving</div>
                      ) : (
                        <Table striped>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>BOM Number</Table.Th>
                              <Table.Th>Supplier</Table.Th>
                              <Table.Th>Items</Table.Th>
                              <Table.Th>Total Amount</Table.Th>
                              <Table.Th>Expected Delivery</Table.Th>
                              <Table.Th>Status</Table.Th>
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {pendingReceiving.map((item: any) => (
                              <Table.Tr key={item.id}>
                                <Table.Td><Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>{item.bomNumber}</Text></Table.Td>
                                <Table.Td>{item.supplierName}</Table.Td>
                                <Table.Td>
                                  {item.bomData?.items?.map((i: any) => (
                                    <div key={i.itemName} style={{ fontSize: "12px" }}>{i.itemName} — {i.quantity} {i.unit} <span style={{ color: "#888" }}>({i.itemType})</span></div>
                                  ))}
                                </Table.Td>
                                <Table.Td><Text style={{ fontWeight: "600", color: "#28a745" }}>PKR {item.totalAmount?.toLocaleString()}</Text></Table.Td>
                                <Table.Td>{new Date(item.deliveryDate).toLocaleDateString()}</Table.Td>
                                <Table.Td><Badge color="blue">Awaiting Delivery</Badge></Table.Td>
                                <Table.Td>
                                  <Button size="xs" onClick={() => { setSelectedBom(item); const qtys: any = {}; item.bomData.items.forEach((i: any) => { qtys[i.itemName] = i.quantity; }); setReceivedQtys(qtys); setShowReceivingModal(true); }} style={{ backgroundColor: "#28a745", fontFamily: "Poppins, sans-serif" }}>
                                    Receive Items
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="completed" pt="md">
                      {receivingRecords.length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>No items received yet</div>
                      ) : (
                        <Table striped>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>BOM Number</Table.Th>
                              <Table.Th>Items Received</Table.Th>
                              <Table.Th>Received By</Table.Th>
                              <Table.Th>Received Date</Table.Th>
                              <Table.Th>Status</Table.Th>
                              <Table.Th>Notes</Table.Th>
                              <Table.Th>Action</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {receivingRecords.map((item: any) => (
                              <Table.Tr key={item.id}>
                                <Table.Td><Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>{item.bomNumber}</Text></Table.Td>
                                <Table.Td>
                                  {item.items?.map((i: any) => (
                                    <div key={i.itemName} style={{ fontSize: "12px" }}>{i.itemName} — {i.receivedQuantity ?? i.quantity} {i.unit} <span style={{ color: "#888" }}>({i.itemType})</span></div>
                                  ))}
                                </Table.Td>
                                <Table.Td>{item.receivedBy}</Table.Td>
                                <Table.Td>{new Date(item.receivedDate).toLocaleString()}</Table.Td>
                                <Table.Td><Badge color="green">Received</Badge></Table.Td>
                                <Table.Td style={{ fontSize: "12px", color: "#666" }}>{item.notes || 'No notes'}</Table.Td>
                                <Table.Td>
                                  <div style={{ display: "flex", gap: "6px" }}>
                                    <Button size="xs" onClick={() => { setSelectedRecord(item); setShowRecordModal(true); }} style={{ backgroundColor: "#007bff", fontFamily: "Poppins, sans-serif" }}>
                                      View
                                    </Button>
                                    <Button size="xs" onClick={() => downloadReceivingPDF(item)} style={{ backgroundColor: "#28a745", fontFamily: "Poppins, sans-serif" }}>
                                      Download GRN
                                    </Button>
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

                <Tabs.Panel value="products" pt="md">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <Text style={{ fontSize: "18px", fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>Products</Text>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <Button onClick={() => openHistory()} style={{ backgroundColor: "#6f42c1", fontFamily: "Poppins, sans-serif" }}>
                        History
                      </Button>
                      <Button onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', specification: '', category: '', price: 0, stock: 0, unit: 'pieces' }); setProductImages([]); setShowProductForm(true); }} style={{ backgroundColor: "#007bff", fontFamily: "Poppins, sans-serif" }}>
                        + Add Product
                      </Button>
                    </div>
                  </div>
                  {products.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#999", border: "2px dashed #dee2e6", borderRadius: "12px" }}>
                      <Text style={{ fontSize: "14px", fontFamily: "Poppins, sans-serif" }}>No products yet. Click "+ Add Product" to get started.</Text>
                    </div>
                  ) : (
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Name</Table.Th>
                          <Table.Th>Category</Table.Th>
                          <Table.Th>Price</Table.Th>
                          <Table.Th>Stock</Table.Th>
                          <Table.Th>Unit</Table.Th>
                          <Table.Th>Added By</Table.Th>
                          <Table.Th>Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {products.map((p: any) => (
                          <Table.Tr key={p.id} style={{ cursor: "pointer" }} onClick={() => { setDetailProduct(p); setShowProductDetail(true); }}>
                            <Table.Td>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {p.images?.[0] && <img src={p.images[0]} alt={p.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "4px", border: "1px solid #eee" }} />}
                                <div>
                                  <Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>{p.name}</Text>
                                  {p.description && <Text style={{ fontSize: "11px", color: "#888" }}>{p.description}</Text>}
                                </div>
                              </div>
                            </Table.Td>
                            <Table.Td>{p.category || '—'}</Table.Td>
                            <Table.Td><Text style={{ color: "#28a745", fontWeight: "600" }}>PKR {Number(p.price).toLocaleString()}</Text></Table.Td>
                            <Table.Td>
                              <Badge color={p.stock <= 0 ? "red" : p.stock < 10 ? "orange" : "green"}>{p.stock} {p.unit}</Badge>
                            </Table.Td>
                            <Table.Td>{p.unit}</Table.Td>
                            <Table.Td style={{ fontSize: "12px", color: "#666" }}>{p.created_by}</Table.Td>
                            <Table.Td onClick={e => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <Button size="xs" onClick={() => { setEditingProduct(p); setProductForm({ name: p.name, description: p.description || '', specification: p.specification || '', category: p.category || '', price: p.price, stock: p.stock, unit: p.unit }); setProductImages(p.images || []); setStockAdjust(0); setStockAdjustNote(''); setNewPrice(p.price); setShowProductForm(true); }} style={{ backgroundColor: "#fd7e14" }}>Edit</Button>
                                <Button size="xs" onClick={() => deleteProduct(p.id)} style={{ backgroundColor: "#dc3545" }}>Delete</Button>
                              </div>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  )}
                </Tabs.Panel>

                <Tabs.Panel value="client-orders" pt="md">
                  <Tabs defaultValue="pending">
                    <Tabs.List>
                      <Tabs.Tab value="pending">
                        Pending Orders ({clientOrders.filter(o => o.status === "payment_confirmed").length})
                      </Tabs.Tab>
                      <Tabs.Tab value="fulfilled">
                        Fulfilled Orders ({clientOrders.filter(o => o.status === "fulfilled").length})
                      </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="pending" pt="md">
                      {clientOrders.filter(o => o.status === "payment_confirmed").length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>
                          No pending client orders
                        </div>
                      ) : (
                        <Table striped>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Order ID</Table.Th>
                              <Table.Th>Client</Table.Th>
                              <Table.Th>Product</Table.Th>
                              <Table.Th>Quantity</Table.Th>
                              <Table.Th>Total Amount</Table.Th>
                              <Table.Th>Payment Status</Table.Th>
                              <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {clientOrders.filter(o => o.status === "payment_confirmed").map((order: any) => (
                              <Table.Tr 
                                key={order.id} 
                                style={{ cursor: "pointer" }}
                                onClick={() => { 
                                  setSelectedClientOrder(order); 
                                  setShowClientOrderModal(true); 
                                }}
                              >
                                <Table.Td>
                                  <Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                                    {order.po_number || order.id.slice(0, 8)}
                                  </Text>
                                </Table.Td>
                                <Table.Td>{order.client_name}</Table.Td>
                                <Table.Td>{order.product_name}</Table.Td>
                                <Table.Td>{order.quantity} {order.unit}</Table.Td>
                                <Table.Td>
                                  <Text style={{ fontWeight: "600", color: "#28a745" }}>
                                    PKR {Number(order.total_price).toLocaleString()}
                                  </Text>
                                </Table.Td>
                                <Table.Td>
                                  <Badge color="green">✓ Payment Confirmed</Badge>
                                </Table.Td>
                                <Table.Td onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    size="xs" 
                                    onClick={() => { 
                                      setSelectedClientOrder(order); 
                                      setShowClientOrderModal(true); 
                                    }} 
                                    style={{ backgroundColor: "#007bff", fontFamily: "Poppins, sans-serif" }}
                                  >
                                    View & Fulfill
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      )}
                    </Tabs.Panel>

                    <Tabs.Panel value="fulfilled" pt="md">
                      {clientOrders.filter(o => o.status === "fulfilled").length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#6c757d", fontFamily: "Poppins, sans-serif" }}>
                          No fulfilled orders yet
                        </div>
                      ) : (
                        <Table striped>
                          <Table.Thead>
                            <Table.Tr>
                              <Table.Th>Order ID</Table.Th>
                              <Table.Th>Client</Table.Th>
                              <Table.Th>Product</Table.Th>
                              <Table.Th>Quantity</Table.Th>
                              <Table.Th>Total Amount</Table.Th>
                              <Table.Th>Fulfilled Date</Table.Th>
                              <Table.Th>Actions</Table.Th>
                            </Table.Tr>
                          </Table.Thead>
                          <Table.Tbody>
                            {clientOrders.filter(o => o.status === "fulfilled").map((order: any) => (
                              <Table.Tr 
                                key={order.id}
                                style={{ cursor: "pointer" }}
                                onClick={() => { 
                                  setSelectedClientOrder(order); 
                                  setShowClientOrderModal(true); 
                                }}
                              >
                                <Table.Td>
                                  <Text style={{ fontWeight: "600", fontFamily: "Poppins, sans-serif" }}>
                                    {order.po_number || order.id.slice(0, 8)}
                                  </Text>
                                </Table.Td>
                                <Table.Td>{order.client_name}</Table.Td>
                                <Table.Td>{order.product_name}</Table.Td>
                                <Table.Td>{order.quantity} {order.unit}</Table.Td>
                                <Table.Td>
                                  <Text style={{ fontWeight: "600", color: "#28a745" }}>
                                    PKR {Number(order.total_price).toLocaleString()}
                                  </Text>
                                </Table.Td>
                                <Table.Td>{order.fulfilled_at ? new Date(order.fulfilled_at).toLocaleString() : '—'}</Table.Td>
                                <Table.Td onClick={(e) => e.stopPropagation()}>
                                  <Button 
                                    size="xs" 
                                    onClick={() => { 
                                      setSelectedClientOrder(order); 
                                      setShowClientOrderModal(true); 
                                    }} 
                                    style={{ backgroundColor: "#6c757d", fontFamily: "Poppins, sans-serif" }}
                                  >
                                    View Details
                                  </Button>
                                </Table.Td>
                              </Table.Tr>
                            ))}
                          </Table.Tbody>
                        </Table>
                      )}
                    </Tabs.Panel>
                  </Tabs>
                </Tabs.Panel>
              </Tabs>
            </Box>
          </Box>
        </Box>
      </Box>
      
      <Modal
        opened={showReceivingModal}
        onClose={() => setShowReceivingModal(false)}
        title="Receive Items"
        size="xl"
      >
        {selectedBom && (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ 
              padding: "20px", 
              backgroundColor: "#f8f9fa", 
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <Text style={{ fontSize: "18px", fontWeight: "600", marginBottom: "10px" }}>
                    {selectedBom.bomNumber}
                  </Text>
                  <Text style={{ fontSize: "14px", color: "#6c757d" }}>
                    Supplier: {selectedBom.supplierName}
                  </Text>
                  <Text style={{ fontSize: "14px", color: "#6c757d" }}>
                    Expected Delivery: {new Date(selectedBom.deliveryDate).toLocaleDateString()}
                  </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Text style={{ fontSize: "24px", fontWeight: "700", color: "#28a745" }}>
                    PKR {selectedBom.totalAmount.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: "14px", color: "#6c757d" }}>
                    {selectedBom.bomData.items.length} items to receive
                  </Text>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}>
                Items to Receive
              </Text>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Item Name</Table.Th>
                    <Table.Th>Type</Table.Th>
                    <Table.Th>Expected Qty</Table.Th>
                    <Table.Th>Received Qty</Table.Th>
                    <Table.Th>Unit</Table.Th>
                    <Table.Th>Unit Price</Table.Th>
                    <Table.Th>Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {selectedBom.bomData.items.map((item: any) => {
                    const itemRate = selectedBom.bestQuote?.itemRates?.[item.itemName] || selectedBom.bestQuote?.itemRates?.[item.id];
                    const received = receivedQtys[item.itemName] ?? item.quantity;
                    const diff = received - item.quantity;
                    return (
                      <Table.Tr key={item.itemName}>
                        <Table.Td><Text style={{ fontWeight: "600" }}>{item.itemName}</Text></Table.Td>
                        <Table.Td>{item.itemType}</Table.Td>
                        <Table.Td><Text style={{ fontWeight: "600", color: "#007bff" }}>{item.quantity}</Text></Table.Td>
                        <Table.Td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <input
                              type="number"
                              min={0}
                              value={received}
                              onChange={e => setReceivedQtys(prev => ({ ...prev, [item.itemName]: parseInt(e.target.value) || 0 }))}
                              style={{ width: "80px", padding: "4px 8px", border: `1px solid ${diff < 0 ? "#dc3545" : diff > 0 ? "#fd7e14" : "#28a745"}`, borderRadius: "4px", fontSize: "13px" }}
                            />
                            {diff !== 0 && (
                              <Text style={{ fontSize: "11px", color: diff < 0 ? "#dc3545" : "#fd7e14", fontWeight: "600" }}>
                                {diff > 0 ? `+${diff} extra` : `${diff} short`}
                              </Text>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>{item.unit}</Table.Td>
                        <Table.Td>PKR {itemRate?.unitPrice?.toLocaleString() || 0}</Table.Td>
                        <Table.Td>
                          <Text style={{ fontWeight: "600", color: "#28a745" }}>
                            PKR {((itemRate?.unitPrice || 0) * received).toLocaleString()}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <Text style={{ fontSize: "16px", fontWeight: "600", marginBottom: "10px" }}>
                Receiving Information
              </Text>
              <div style={{ 
                padding: "20px", 
                backgroundColor: "#e8f5e8", 
                borderRadius: "8px",
                marginBottom: "15px"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                  <div>
                    <Text style={{ fontSize: "12px", color: "#155724", fontWeight: "600" }}>
                      RECEIVING DATE & TIME
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#155724" }}>
                      {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                    </Text>
                  </div>
                  <div>
                    <Text style={{ fontSize: "12px", color: "#155724", fontWeight: "600" }}>
                      RECEIVED BY
                    </Text>
                    <Text style={{ fontSize: "14px", color: "#155724" }}>
                      {currentUser?.username || 'unknown'}
                    </Text>
                  </div>
                </div>
              </div>
              
              <Textarea
                label="Receiving Notes (Optional)"
                placeholder="Add any notes about the received items, condition, packaging, etc."
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                rows={3}
                style={{ marginBottom: "20px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <Button
                onClick={() => setShowReceivingModal(false)}
                style={{
                  backgroundColor: "transparent",
                  color: "#6c757d",
                  border: "1px solid #dee2e6"
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReceiveItems}
                style={{ backgroundColor: "#28a745" }}
              >
                Confirm Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Received Record Modal */}
      <Modal
        opened={showRecordModal}
        onClose={() => { setShowRecordModal(false); setSelectedRecord(null); }}
        title="Received Items Detail"
        size="xl"
      >
        {selectedRecord && (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ backgroundColor: "#f8f9fa", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <Text style={{ fontSize: "11px", color: "#6c757d", textTransform: "uppercase", fontWeight: "600" }}>BOM Number</Text>
                <Text style={{ fontSize: "15px", fontWeight: "700" }}>{selectedRecord.bomNumber}</Text>
              </div>
              <div>
                <Text style={{ fontSize: "11px", color: "#6c757d", textTransform: "uppercase", fontWeight: "600" }}>Received By</Text>
                <Text style={{ fontSize: "15px", fontWeight: "600" }}>{selectedRecord.receivedBy}</Text>
              </div>
              <div>
                <Text style={{ fontSize: "11px", color: "#6c757d", textTransform: "uppercase", fontWeight: "600" }}>Received Date</Text>
                <Text style={{ fontSize: "15px", fontWeight: "600" }}>{new Date(selectedRecord.receivedDate).toLocaleString()}</Text>
              </div>
              {selectedRecord.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <Text style={{ fontSize: "11px", color: "#6c757d", textTransform: "uppercase", fontWeight: "600" }}>Notes</Text>
                  <Text style={{ fontSize: "14px" }}>{selectedRecord.notes}</Text>
                </div>
              )}
            </div>

            <Text style={{ fontSize: "15px", fontWeight: "600", marginBottom: "12px" }}>Items Received</Text>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Item Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Expected</Table.Th>
                  <Table.Th>Received</Table.Th>
                  <Table.Th>Variance</Table.Th>
                  <Table.Th>Unit</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedRecord.items?.map((item: any, i: number) => {
                  const variance = item.variance ?? (item.receivedQuantity != null ? item.receivedQuantity - (item.expectedQuantity ?? item.quantity) : 0);
                  return (
                    <Table.Tr key={i}>
                      <Table.Td><Text style={{ fontWeight: "600" }}>{item.itemName}</Text></Table.Td>
                      <Table.Td><Text style={{ fontSize: "13px" }}>{item.itemType}</Text></Table.Td>
                      <Table.Td><Text style={{ color: "#007bff", fontWeight: "600" }}>{item.expectedQuantity ?? item.quantity}</Text></Table.Td>
                      <Table.Td><Text style={{ color: "#28a745", fontWeight: "600" }}>{item.receivedQuantity ?? item.quantity}</Text></Table.Td>
                      <Table.Td>
                        {variance === 0
                          ? <Badge color="green" size="sm">Exact</Badge>
                          : variance > 0
                            ? <Badge color="orange" size="sm">+{variance} extra</Badge>
                            : <Badge color="red" size="sm">{variance} short</Badge>
                        }
                      </Table.Td>
                      <Table.Td>{item.unit}</Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Modal>

      {/* Product Form Modal */}
      <Modal opened={showProductForm} onClose={() => setShowProductForm(false)} title={editingProduct ? "Edit Product" : "Add Product"} size="lg">
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: "Poppins, sans-serif" }}>
          {[
            { label: "Name *", field: "name", type: "text" },
            { label: "Description", field: "description", type: "text" },
            { label: "Specification", field: "specification", type: "text" },
            { label: "Category", field: "category", type: "text" },
          ].map(({ label, field, type }) => (
            <div key={field}>
              <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>{label}</Text>
              <input type={type} value={(productForm as any)[field]} onChange={e => setProductForm(prev => ({ ...prev, [field]: e.target.value }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }} />
            </div>
          ))}
          {!editingProduct && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Price (PKR)</Text>
                <input type="number" min={0} value={productForm.price} onChange={e => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }} />
              </div>
              <div>
                <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Stock Quantity</Text>
                <input type="number" min={0} value={productForm.stock} onChange={e => setProductForm(prev => ({ ...prev, stock: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }} />
              </div>
              <div>
                <Text style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Unit</Text>
                <select value={productForm.unit} onChange={e => setProductForm(prev => ({ ...prev, unit: e.target.value }))} style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }}>
                  {["pieces", "kg", "liters", "meters", "boxes", "units"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Stock & Price adjustment — edit mode only */}
          {editingProduct && (
            <div style={{ border: "1px solid #f0f0f0", borderRadius: "8px", overflow: "hidden" }}>
              {/* Stock adjustment */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
                <Text style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "10px" }}>
                  Stock Adjustment <span style={{ color: "#888", fontWeight: "400" }}>— current: {editingProduct.stock} {editingProduct.unit}</span>
                </Text>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                  <button onClick={() => setStockAdjust(v => v - 1)} style={{ width: "32px", height: "32px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff", fontSize: "18px", cursor: "pointer", lineHeight: "30px" }}>−</button>
                  <input type="number" value={stockAdjust} onChange={e => setStockAdjust(parseInt(e.target.value) || 0)}
                    style={{ width: "80px", padding: "6px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px", textAlign: "center" }} />
                  <button onClick={() => setStockAdjust(v => v + 1)} style={{ width: "32px", height: "32px", border: "1px solid #ddd", borderRadius: "6px", background: "#fff", fontSize: "18px", cursor: "pointer", lineHeight: "30px" }}>+</button>
                  {stockAdjust !== 0 && (
                    <Text style={{ fontSize: "12px", color: stockAdjust > 0 ? "#28a745" : "#dc3545", fontWeight: "600" }}>
                      → {editingProduct.stock + stockAdjust} {editingProduct.unit}
                    </Text>
                  )}
                </div>
                <input type="text" placeholder="Note (optional)" value={stockAdjustNote} onChange={e => setStockAdjustNote(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "12px" }} />
                <Button size="xs" disabled={stockAdjust === 0} onClick={async () => {
                  const res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'adjust_stock', id: editingProduct.id, productName: editingProduct.name, adjustment: stockAdjust, note: stockAdjustNote, updatedBy: currentUser?.username }) });
                  if (res.ok) { const updated = await res.json(); setEditingProduct({ ...editingProduct, stock: updated.stock }); setStockAdjust(0); setStockAdjustNote(''); fetchProducts(); } else alert('Failed');
                }} style={{ marginTop: "8px", backgroundColor: stockAdjust > 0 ? "#28a745" : "#dc3545", color: "white" }}>
                  {stockAdjust > 0 ? `Add ${stockAdjust}` : `Remove ${Math.abs(stockAdjust)}`}
                </Button>
              </div>

              {/* Price update */}
              <div style={{ padding: "14px 16px" }}>
                <Text style={{ fontSize: "12px", fontWeight: "600", color: "#333", marginBottom: "10px" }}>
                  Update Price <span style={{ color: "#888", fontWeight: "400" }}>— current: PKR {Number(editingProduct.price).toLocaleString()}</span>
                </Text>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="number" min={0} value={newPrice} onChange={e => setNewPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: "140px", padding: "6px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "13px" }} />
                  <Button size="xs" disabled={newPrice === editingProduct.price} onClick={async () => {
                    const res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_price', id: editingProduct.id, productName: editingProduct.name, price: newPrice, updatedBy: currentUser?.username }) });
                    if (res.ok) { const updated = await res.json(); setEditingProduct({ ...editingProduct, price: updated.price }); fetchProducts(); } else alert('Failed');
                  }} style={{ backgroundColor: "#007bff", color: "white" }}>Set Price</Button>
                </div>
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>Product Images</Text>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "2px dashed #ddd", borderRadius: "8px", cursor: "pointer", backgroundColor: "#fafafa" }}>
              <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => e.target.files && handleImageUpload(e.target.files)} />
              <Text style={{ fontSize: "13px", color: "#666" }}>{uploadingImages ? "Uploading..." : "Click to upload images (multiple allowed)"}</Text>
            </label>
            {productImages.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
                {productImages.map((url, i) => (
                  <div key={i} style={{ position: "relative" }}>
                    <img src={url} alt={`product-${i}`} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px", border: "1px solid #ddd" }} />
                    <button onClick={() => setProductImages(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#dc3545", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px", cursor: "pointer", lineHeight: "18px", textAlign: "center" }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
            <Button onClick={() => setShowProductForm(false)} style={{ backgroundColor: "transparent", color: "#666", border: "1px solid #ddd" }}>Cancel</Button>
            <Button onClick={submitProduct} disabled={uploadingImages} style={{ backgroundColor: "#007bff", color: "white" }}>{editingProduct ? "Update" : "Add Product"}</Button>
          </div>
        </div>
      </Modal>

      {/* Product History Modal */}
      <Modal opened={showProductHistory} onClose={() => setShowProductHistory(false)} title={selectedProduct ? `History — ${selectedProduct.name}` : "All Products History"} size="xl">
        {productHistory.length === 0 ? (
          <Text style={{ color: "#999", textAlign: "center", padding: "20px" }}>No history yet.</Text>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Stock Before</Table.Th>
                <Table.Th>Stock After</Table.Th>
                <Table.Th>By</Table.Th>
                <Table.Th>Date</Table.Th>
                <Table.Th>Note</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {productHistory.map((h: any) => (
                <Table.Tr key={h.id} style={{ cursor: "pointer", backgroundColor: selectedHistoryEntry?.id === h.id ? "#f0f4ff" : undefined }} onClick={() => setSelectedHistoryEntry(selectedHistoryEntry?.id === h.id ? null : h)}>
                  <Table.Td style={{ fontWeight: "600", fontSize: "13px" }}>{h.product_name}</Table.Td>
                  <Table.Td>
                    <Badge color={
                      h.action === 'added' ? 'blue' :
                      h.action === 'edited' ? 'yellow' :
                      h.action === 'deleted' ? 'red' :
                      h.action === 'stock_in' ? 'green' : h.action === 'price_updated' ? 'cyan' : 'orange'
                    }>
                      {h.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>{h.stock_before ?? '—'}</Table.Td>
                  <Table.Td style={{ fontSize: "13px" }}>{h.stock_after ?? '—'}</Table.Td>
                  <Table.Td style={{ fontSize: "12px" }}>{h.created_by}</Table.Td>
                  <Table.Td style={{ fontSize: "12px" }}>{new Date(h.created_at).toLocaleString()}</Table.Td>
                  <Table.Td style={{ fontSize: "12px", color: "#666" }}>{h.note || '—'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
        {/* History Entry Detail Panel */}
        {selectedHistoryEntry && (
          <div style={{ marginTop: "16px", border: "1px solid #e8e8e8", borderRadius: "12px", overflow: "hidden", fontFamily: "Poppins, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {(selectedHistoryEntry.snapshot_image || selectedHistoryEntry.product?.images?.[0])
                  ? <img src={selectedHistoryEntry.snapshot_image || selectedHistoryEntry.product.images[0]} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", border: "1px solid #eee" }} />
                  : <div style={{ width: "40px", height: "40px", borderRadius: "6px", backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>📦</div>
                }
                <div>
                  <Text style={{ fontWeight: "700", fontSize: "15px", color: "#111" }}>{selectedHistoryEntry.product_name}</Text>
                  <Text style={{ fontSize: "11px", color: "#999" }}>{new Date(selectedHistoryEntry.created_at).toLocaleString()} · by {selectedHistoryEntry.created_by}</Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Badge color={
                  selectedHistoryEntry.action === 'added' ? 'blue' :
                  selectedHistoryEntry.action === 'edited' ? 'yellow' :
                  selectedHistoryEntry.action === 'deleted' ? 'red' :
                  selectedHistoryEntry.action === 'stock_in' ? 'green' : selectedHistoryEntry.action === 'price_updated' ? 'cyan' : 'orange'
                }>{selectedHistoryEntry.action}</Badge>
                <button onClick={() => setSelectedHistoryEntry(null)} style={{ background: "#f5f5f5", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontSize: "14px", color: "#666" }}>×</button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #f0f0f0" }}>
              {[
                { label: "Price / Unit", value: (selectedHistoryEntry.snapshot_price != null ? `PKR ${Number(selectedHistoryEntry.snapshot_price).toLocaleString()}` : selectedHistoryEntry.product ? `PKR ${Number(selectedHistoryEntry.product.price).toLocaleString()}` : "—") + (selectedHistoryEntry.snapshot_unit ? ` / ${selectedHistoryEntry.snapshot_unit}` : "") },
                { label: "Stock Before", value: selectedHistoryEntry.stock_before ?? "—" },
                { label: "Stock After", value: selectedHistoryEntry.stock_after ?? "—" },
                { label: "Change", value: selectedHistoryEntry.quantity_change != null ? (selectedHistoryEntry.action === 'stock_out' || selectedHistoryEntry.action === 'deleted' ? `−${selectedHistoryEntry.quantity_change}` : `+${selectedHistoryEntry.quantity_change}`) : "—" },
              ].map(({ label, value }, i) => (
                <div key={label} style={{ padding: "12px 16px", borderRight: i < 3 ? "1px solid #f0f0f0" : "none" }}>
                  <Text style={{ fontSize: "10px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</Text>
                  <Text style={{ fontSize: "14px", fontWeight: "700", color: "#222" }}>{value}</Text>
                </div>
              ))}
            </div>

            {/* Images row — use snapshot or live product images */}
            {(() => {
              const imgs = selectedHistoryEntry.snapshot_image
                ? [selectedHistoryEntry.snapshot_image]
                : selectedHistoryEntry.product?.images || [];
              return imgs.length > 0 ? (
                <div style={{ display: "flex", gap: "8px", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", overflowX: "auto" }}>
                  {imgs.map((url: string, i: number) => (
                    <img key={i} src={url} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px", border: "1px solid #eee", flexShrink: 0 }} />
                  ))}
                </div>
              ) : null;
            })()}

            {/* Note */}
            {selectedHistoryEntry.note && (
              <div style={{ padding: "12px 16px", backgroundColor: "#fafafa" }}>
                <Text style={{ fontSize: "11px", color: "#bbb", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>Note</Text>
                <Text style={{ fontSize: "13px", color: "#555" }}>{selectedHistoryEntry.note}</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal opened={showProductDetail} onClose={() => setShowProductDetail(false)} title="" size="lg"
        styles={{ header: { display: "none" }, body: { padding: 0 } }}
      >
        {detailProduct && (
          <div style={{ fontFamily: "Poppins, sans-serif", borderRadius: "8px", overflow: "hidden" }}>

            {/* Top banner */}
            <div style={{ backgroundColor: "#111", padding: "28px 28px 20px", position: "relative" }}>
              <button onClick={() => setShowProductDetail(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "16px", lineHeight: "28px", textAlign: "center" }}>×</button>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {detailProduct.images?.[0]
                  ? <img src={detailProduct.images[0]} alt={detailProduct.name} style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px", border: "2px solid rgba(255,255,255,0.2)" }} />
                  : <div style={{ width: "64px", height: "64px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>📦</div>
                }
                <div>
                  <Text style={{ fontSize: "22px", fontWeight: "700", color: "white", lineHeight: 1.2 }}>{detailProduct.name}</Text>
                  <Text style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{detailProduct.category || "No category"}</Text>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <Text style={{ fontSize: "24px", fontWeight: "700", color: "#4ade80" }}>PKR {Number(detailProduct.price).toLocaleString()}</Text>
                  <Badge size="sm" color={detailProduct.stock <= 0 ? "red" : detailProduct.stock < 10 ? "orange" : "green"} style={{ marginTop: "6px" }}>
                    {detailProduct.stock <= 0 ? "Out of Stock" : detailProduct.stock < 10 ? "Low Stock" : "In Stock"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Images strip */}
            {detailProduct.images?.length > 1 && (
              <div style={{ display: "flex", gap: "8px", padding: "12px 28px", backgroundColor: "#1a1a1a", overflowX: "auto" }}>
                {detailProduct.images.map((url: string, i: number) => (
                  <img key={i} src={url} alt={`img-${i}`} style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", border: "2px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                ))}
              </div>
            )}

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f0f0f0" }}>
              {[
                { label: "Stock", value: `${detailProduct.stock} ${detailProduct.unit}`, color: detailProduct.stock <= 0 ? "#dc3545" : "#28a745" },
                { label: "Unit", value: detailProduct.unit, color: "#333" },
                { label: "Added On", value: new Date(detailProduct.created_at).toLocaleDateString(), color: "#333" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ padding: "16px 20px", textAlign: "center", borderRight: "1px solid #f0f0f0" }}>
                  <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>{label}</Text>
                  <Text style={{ fontSize: "16px", fontWeight: "700", color }}>{value}</Text>
                </div>
              ))}
            </div>

            {/* Details */}
            <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {detailProduct.description && (
                <div>
                  <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Description</Text>
                  <Text style={{ fontSize: "14px", color: "#333", lineHeight: 1.6 }}>{detailProduct.description}</Text>
                </div>
              )}
              {detailProduct.specification && (
                <div>
                  <Text style={{ fontSize: "11px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Specification</Text>
                  <Text style={{ fontSize: "14px", color: "#333", lineHeight: 1.6 }}>{detailProduct.specification}</Text>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px", borderTop: "1px solid #f5f5f5" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>👤</div>
                <Text style={{ fontSize: "12px", color: "#888" }}>Added by <strong style={{ color: "#333" }}>{detailProduct.created_by}</strong></Text>
              </div>
            </div>

          </div>
        )}
      </Modal>

      <Modal
        opened={showClientOrderModal}
        onClose={() => { setShowClientOrderModal(false); setSelectedClientOrder(null); }}
        title=""
        size="xl"
        styles={{ 
          header: { display: "none" }, 
          body: { padding: 0 },
          content: { width: "1600px", maxWidth: "98vw" }
        }}
      >
        {selectedClientOrder && (
          <div style={{ fontFamily: "Poppins, sans-serif" }}>
            <div style={{ backgroundColor: "#111", padding: "20px 24px", position: "relative" }}>
              <button onClick={() => { setShowClientOrderModal(false); setSelectedClientOrder(null); }} style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer" }}>×</button>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", textTransform: "uppercase", marginBottom: "4px" }}>Client Order</Text>
              <Text style={{ color: "white", fontSize: "20px", fontWeight: "700" }}>
                {selectedClientOrder.po_number || `#${selectedClientOrder.id.slice(0, 8)}`}
              </Text>
              <div style={{ marginTop: "8px" }}>
                {selectedClientOrder.status === "payment_confirmed" && (
                  <Badge color="green">✓ Payment Confirmed - Ready to Fulfill</Badge>
                )}
                {selectedClientOrder.status === "fulfilled" && (
                  <Badge color="blue">✓ Fulfilled</Badge>
                )}
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Client Information</Text>
              {(() => {
                const client = clients.find(c => c.id === selectedClientOrder.client_id);
                return client ? (
                  <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                    <div style={{ marginBottom: "8px" }}><strong>Name:</strong> {client.name}</div>
                    {client.email && <div style={{ marginBottom: "8px" }}><strong>Email:</strong> {client.email}</div>}
                    {client.phone && <div style={{ marginBottom: "8px" }}><strong>Phone:</strong> {client.phone}</div>}
                    {client.company && <div style={{ marginBottom: "8px" }}><strong>Company:</strong> {client.company}</div>}
                    {client.address && <div><strong>Address:</strong> {client.address}</div>}
                  </div>
                ) : null;
              })()}

              <Text style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>Order Details</Text>
              <div style={{ backgroundColor: "#f8f9fa", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
                <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e0e0e0" }}>
                  <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "8px" }}>{selectedClientOrder.product_name}</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>Quantity: {selectedClientOrder.quantity} {selectedClientOrder.unit}</div>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <Text style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Price Breakdown</Text>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                    <span>Unit Price:</span>
                    <span style={{ fontWeight: "600" }}>PKR {Number(selectedClientOrder.unit_price || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                    <span>Quantity:</span>
                    <span>× {selectedClientOrder.quantity}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", paddingBottom: "8px", borderBottom: "1px solid #e0e0e0", fontSize: "13px" }}>
                    <span style={{ fontWeight: "600" }}>Product Subtotal:</span>
                    <span style={{ fontWeight: "600" }}>PKR {(Number(selectedClientOrder.unit_price || 0) * selectedClientOrder.quantity).toFixed(2)}</span>
                  </div>

                  <Text style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", color: "#333" }}>Additional Charges</Text>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                    <span>Tax:</span>
                    <span>PKR {Number(selectedClientOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                    <span>Transport Cost:</span>
                    <span>PKR {Number(selectedClientOrder.transport || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                    <span>Other Charges:</span>
                    <span>PKR {Number(selectedClientOrder.other_charges || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: "2px solid #333", fontSize: "17px", fontWeight: "700" }}>
                  <span>Grand Total:</span>
                  <span style={{ color: "#28a745" }}>PKR {Number(selectedClientOrder.total_price || 0).toFixed(2)}</span>
                </div>
              </div>

              {selectedClientOrder.payment_method && (
                <div style={{ backgroundColor: "#d4edda", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px" }}>
                  <Text style={{ fontWeight: "600", marginBottom: "6px", color: "#155724" }}>Payment Information</Text>
                  <div style={{ color: "#155724" }}>
                    <div><strong>Method:</strong> {selectedClientOrder.payment_method.replace('_', ' ').toUpperCase()}</div>
                    <div><strong>Amount:</strong> PKR {Number(selectedClientOrder.payment_amount || selectedClientOrder.total_price).toLocaleString()}</div>
                    <div><strong>Confirmed By:</strong> {selectedClientOrder.payment_confirmed_by}</div>
                    <div><strong>Confirmed On:</strong> {new Date(selectedClientOrder.payment_confirmed_at).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {selectedClientOrder.status === "payment_confirmed" ? (
                <div>
                  <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                    <Button 
                      onClick={() => {
                        const client = clients.find(c => c.id === selectedClientOrder.client_id);
                        if (!client || !client.phone) {
                          alert("Client phone number not available");
                          return;
                        }
                        
                        const message = `*Order Ready for Delivery*\n\nDear ${client.name},\n\nYour order is ready for delivery:\n\n*Order #:* ${selectedClientOrder.po_number || selectedClientOrder.id.slice(0, 8)}\n*Product:* ${selectedClientOrder.product_name}\n*Quantity:* ${selectedClientOrder.quantity} ${selectedClientOrder.unit}\n*Total Amount:* PKR ${Number(selectedClientOrder.total_price).toLocaleString()}\n\nWe will contact you shortly to arrange delivery.\n\nThank you!`;
                        
                        const whatsappUrl = `https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                      }}
                      style={{ flex: 1, backgroundColor: "#25D366", color: "white" }}
                    >
                      📱 Contact Client via WhatsApp
                    </Button>
                  </div>

                  <div style={{ backgroundColor: "#fff3cd", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", color: "#856404" }}>
                    <strong>⚠️ Action Required:</strong> This order is ready to be fulfilled. Fulfilling will deduct {selectedClientOrder.quantity} {selectedClientOrder.unit} from inventory stock.
                  </div>
                  
                  <Button 
                    onClick={async () => {
                      if (!confirm(`Mark this order as fulfilled?\n\nThis will:\n- Deduct ${selectedClientOrder.quantity} ${selectedClientOrder.unit} from inventory\n- Record this transaction in product history\n- Generate departure report`)) return;
                      
                      try {
                        // Update order status
                        const response = await fetch("/api/crm/orders", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id: selectedClientOrder.id,
                            status: "fulfilled",
                            fulfilledBy: currentUser?.username,
                            fulfilledAt: new Date().toISOString(),
                            productName: selectedClientOrder.product_name,
                            quantity: selectedClientOrder.quantity,
                            clientName: selectedClientOrder.client_name
                          })
                        });
                        
                        if (response.ok) {
                          alert("Order fulfilled successfully! Stock has been updated.");
                          setShowClientOrderModal(false);
                          fetchClientOrders();
                          fetchProducts(); // Refresh products to show updated stock
                        } else {
                          const error = await response.json();
                          alert(`Failed to fulfill order: ${error.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        console.error("Error fulfilling order:", error);
                        alert("Error fulfilling order. Please try again.");
                      }
                    }}
                    fullWidth
                    style={{ backgroundColor: "#28a745", color: "white", padding: "12px", fontSize: "15px", fontWeight: "600" }}
                  >
                    ✓ Mark as Fulfilled & Update Inventory
                  </Button>
                </div>
              ) : (
                <div>
                  <div style={{ backgroundColor: "#d4edda", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "13px", color: "#155724", textAlign: "center" }}>
                    <strong>✓ Order Fulfilled</strong>
                    <div style={{ fontSize: "12px", marginTop: "4px" }}>
                      Fulfilled by {selectedClientOrder.fulfilled_by} on {new Date(selectedClientOrder.fulfilled_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const client = clients.find(c => c.id === selectedClientOrder.client_id);
                      downloadDepartureReportPDF(selectedClientOrder, client);
                    }}
                    fullWidth
                    style={{ backgroundColor: "#007bff", color: "white", padding: "12px", fontSize: "14px" }}
                  >
                    📄 Download Departure Report
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <LogoutButton />
    </ProtectedRoute>
  );
}
