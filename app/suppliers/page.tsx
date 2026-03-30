"use client";

import { useEffect, useState } from "react";
import { Box, Text } from "@mantine/core";
import { Navigation } from "@/components/Navigation";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface BOMSend {
  id: string;
  supplierId: string;
  bomNumber: string;
  status: string;
  sentAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

interface SupplierQuote {
  id: string;
  bomSendId: string;
  supplierId: string;
  supplierName: string;
  bomNumber: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    quotedPrice: number;
    totalPrice: number;
    leadTime?: string;
    notes?: string;
  }>;
  totalAmount: number;
  validUntil?: string;
  notes?: string;
  submittedAt: string;
  status: string;
}

export default function Suppliers() {
  const [currentPage, setCurrentPage] = useState(2);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allBoms, setAllBoms] = useState<BOMSend[]>([]);
  const [allQuotes, setAllQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedBomNumber, setSelectedBomNumber] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const suppliersRes = await fetch("/api/suppliers");
        if (suppliersRes.ok) {
          const suppliersData = await suppliersRes.json();
          setSuppliers(suppliersData);
        } else {
          setError("Failed to fetch suppliers");
        }

        const bomsRes = await fetch("/api/supplier/boms");
        if (bomsRes.ok) {
          const bomsData = await bomsRes.json();
          setAllBoms(bomsData);
        }

        const quotesRes = await fetch("/api/supplier/quotes");
        if (quotesRes.ok) {
          const quotesData = await quotesRes.json();
          setAllQuotes(quotesData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSupplierBoms = (supplierId: string) => {
    return allBoms.filter((bom) => bom.supplierId === supplierId);
  };

  const getSupplierQuotes = (supplierId: string) => {
    return allQuotes.filter((quote) => quote.supplierId === supplierId);
  };

  const handleViewBoms = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDrawer(true);
  };

  const handleQuoteSubmitted = () => {
    // Refresh quotes data
    fetch("/api/supplier/quotes")
      .then(res => res.json())
      .then(data => {
        setAllQuotes(data);
        setToast({ message: "Quote submitted successfully!", type: 'success' });
        setTimeout(() => setToast(null), 3000);
      })
      .catch(error => {
        console.error(error);
        setToast({ message: "Failed to refresh quotes", type: 'error' });
        setTimeout(() => setToast(null), 3000);
      });
  };

  const handleCompareBoms = () => {
    setShowComparison(true);
  };

  const getUniqueBomNumbers = () => {
    const bomNumbers = [...new Set(allBoms.map(bom => bom.bomNumber))];
    return bomNumbers;
  };

  return (
    <Box
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "white",
        display: "flex",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <Navigation currentPage={currentPage} />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "white",
            color: "#000",
            padding: "16px 24px",
            border: "1px solid #e0e0e0",
            zIndex: 1000,
            fontSize: "14px",
            fontWeight: "400",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Main Content */}
      <Box
        style={{
          marginLeft: "300px",
          padding: "40px",
          width: "calc(100% - 300px)",
        }}
      >
        <Text
          style={{
            fontSize: "32px",
            fontWeight: "600",
            color: "#000",
            marginBottom: "8px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Suppliers
        </Text>
        <Text
          style={{
            fontSize: "16px",
            color: "#666",
            marginBottom: "32px",
            fontFamily: "Poppins, sans-serif",
          }}
        >
          Manage supplier profiles and their BOMs
        </Text>

        {/* Summary Stats */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "1px", 
          marginBottom: "40px",
          border: "1px solid #e0e0e0"
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRight: "1px solid #e0e0e0"
          }}>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Suppliers
            </Text>
            <Text style={{ fontSize: "28px", fontWeight: "300", color: "#000" }}>
              {suppliers.length}
            </Text>
          </div>
          
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRight: "1px solid #e0e0e0"
          }}>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              BOMs Sent
            </Text>
            <Text style={{ fontSize: "28px", fontWeight: "300", color: "#000" }}>
              {allBoms.length}
            </Text>
            <Text style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
              {allBoms.filter(b => b.status === "sent").length} pending
            </Text>
          </div>
          
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRight: "1px solid #e0e0e0"
          }}>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quotes Received
            </Text>
            <Text style={{ fontSize: "28px", fontWeight: "300", color: "#000" }}>
              {allQuotes.length}
            </Text>
            <Text style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
              ${allQuotes.reduce((sum, q) => sum + q.totalAmount, 0).toFixed(0)} total value
            </Text>
          </div>
          
          <div style={{
            backgroundColor: "white",
            padding: "24px"
          }}>
            <Text style={{ fontSize: "12px", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Response Rate
            </Text>
            <Text style={{ fontSize: "28px", fontWeight: "300", color: "#000" }}>
              {allBoms.length > 0 ? Math.round((allQuotes.length / allBoms.length) * 100) : 0}%
            </Text>
            <Text style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
              Overall quote response
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <Box style={{ marginBottom: "32px", display: "flex", gap: "16px", alignItems: "center" }}>
          <button
            onClick={handleCompareBoms}
            disabled={getUniqueBomNumbers().length === 0}
            style={{
              padding: "12px 20px",
              backgroundColor: "white",
              color: getUniqueBomNumbers().length === 0 ? "#ccc" : "#000",
              border: "1px solid #e0e0e0",
              fontSize: "14px",
              fontWeight: "400",
              cursor: getUniqueBomNumbers().length === 0 ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (getUniqueBomNumbers().length > 0) {
                e.currentTarget.style.backgroundColor = "#f8f8f8";
              }
            }}
            onMouseLeave={(e) => {
              if (getUniqueBomNumbers().length > 0) {
                e.currentTarget.style.backgroundColor = "white";
              }
            }}
          >
            Compare BOM Quotes
          </button>
          
          <Text style={{ fontSize: "13px", color: "#666" }}>
            {getUniqueBomNumbers().length} unique BOMs available for comparison
          </Text>
        </Box>

        {loading ? (
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "400px",
            }}
          >
            <Text style={{ color: "#666" }}>Loading suppliers...</Text>
          </Box>
        ) : error ? (
          <Box
            style={{
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              padding: "16px",
              color: "#c33",
            }}
          >
            {error}
          </Box>
        ) : suppliers.length === 0 ? (
          <Box
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              padding: "64px",
              textAlign: "center",
            }}
          >
            <Text style={{ color: "#666" }}>No suppliers found</Text>
          </Box>
        ) : (
          <Box
            style={{
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e0e0e0" }}>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Supplier
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "left",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Contact
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    BOMs Sent
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Quotes Received
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Response Rate
                  </th>
                  <th
                    style={{
                      padding: "16px 20px",
                      textAlign: "center",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const supplierBoms = getSupplierBoms(supplier.id);
                  const supplierQuotes = getSupplierQuotes(supplier.id);
                  const responseRate = supplierBoms.length > 0 
                    ? Math.round((supplierQuotes.length / supplierBoms.length) * 100) 
                    : 0;
                  
                  return (
                    <tr
                      key={supplier.id}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fafafa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "white";
                      }}
                    >
                      <td
                        style={{
                          padding: "20px",
                          fontSize: "14px",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "500", color: "#000", marginBottom: "4px" }}>
                            {supplier.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {supplier.address || "No address"}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "20px",
                          fontSize: "14px",
                        }}
                      >
                        <div>
                          <div style={{ color: "#000", marginBottom: "2px" }}>
                            {supplier.email}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666" }}>
                            {supplier.phone}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ 
                          display: "inline-block",
                          backgroundColor: "white",
                          color: "#000",
                          padding: "6px 12px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {supplierBoms.length}
                        </div>
                        {supplierBoms.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                            {supplierBoms.filter(b => b.status === "sent").length} pending
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ 
                          display: "inline-block",
                          backgroundColor: "white",
                          color: "#000",
                          padding: "6px 12px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {supplierQuotes.length}
                        </div>
                        {supplierQuotes.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                            Total: ${supplierQuotes.reduce((sum, q) => sum + q.totalAmount, 0).toFixed(0)}
                          </div>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ 
                          display: "inline-block",
                          backgroundColor: "white",
                          color: "#000",
                          padding: "6px 12px",
                          border: "1px solid #e0e0e0",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {responseRate}%
                        </div>
                      </td>
                      <td style={{ padding: "20px" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleViewBoms(supplier)}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "white",
                              color: "#000",
                              border: "1px solid #e0e0e0",
                              fontSize: "13px",
                              fontWeight: "400",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#f8f8f8";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "white";
                            }}
                          >
                            View BOMs
                          </button>
                          {supplierBoms.length > 0 && (
                            <button
                              onClick={() => handleViewBoms(supplier)}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "white",
                                color: "#000",
                                border: "1px solid #e0e0e0",
                                fontSize: "13px",
                                fontWeight: "400",
                                cursor: "pointer",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#f8f8f8";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "white";
                              }}
                            >
                              Add Quote
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        )}

        {/* BOM Drawer */}
        {showDrawer && selectedSupplier && (
          <BOMDrawer
            supplier={selectedSupplier}
            boms={getSupplierBoms(selectedSupplier.id)}
            quotes={getSupplierQuotes(selectedSupplier.id)}
            onClose={() => {
              setShowDrawer(false);
              setSelectedSupplier(null);
            }}
            onQuoteSubmitted={handleQuoteSubmitted}
            setToast={setToast}
          />
        )}

        {/* BOM Comparison Modal */}
        {showComparison && (
          <BOMComparisonModal
            bomNumbers={getUniqueBomNumbers()}
            allBoms={allBoms}
            allQuotes={allQuotes}
            suppliers={suppliers}
            onClose={() => {
              setShowComparison(false);
              setSelectedBomNumber("");
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function BOMDrawer({
  supplier,
  boms,
  quotes,
  onClose,
  onQuoteSubmitted,
  setToast,
}: {
  supplier: Supplier;
  boms: BOMSend[];
  quotes: SupplierQuote[];
  onClose: () => void;
  onQuoteSubmitted: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}) {
  const [selectedBom, setSelectedBom] = useState<BOMSend | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteItems, setQuoteItems] = useState<Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    quotedPrice: number;
    leadTime: string;
    notes: string;
  }>>([]);
  const [quoteNotes, setQuoteNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitQuote = (bom: BOMSend) => {
    setSelectedBom(bom);
    setQuoteItems(bom.items.map(item => ({
      itemId: item.id,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      quotedPrice: 0,
      leadTime: "",
      notes: ""
    })));
    setShowQuoteForm(true);
  };

  const handleQuoteItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...quoteItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setQuoteItems(updatedItems);
  };

  const calculateTotal = () => {
    return quoteItems.reduce((total, item) => total + (item.quotedPrice * item.quantity), 0);
  };

  const submitQuote = async () => {
    if (!selectedBom) return;
    
    setSubmitting(true);
    try {
      const quoteData = {
        bomSendId: selectedBom.id,
        supplierId: supplier.id,
        supplierName: supplier.name,
        bomNumber: selectedBom.bomNumber,
        items: quoteItems.map(item => ({
          ...item,
          totalPrice: item.quotedPrice * item.quantity
        })),
        totalAmount: calculateTotal(),
        validUntil: validUntil || undefined,
        notes: quoteNotes || undefined,
      };

      const response = await fetch("/api/supplier/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });

      if (response.ok) {
        setShowQuoteForm(false);
        setSelectedBom(null);
        setQuoteItems([]);
        setQuoteNotes("");
        setValidUntil("");
        onQuoteSubmitted();
      } else {
        setToast({ message: "Failed to submit quote", type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
      setToast({ message: "Error submitting quote", type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const getBomQuote = (bomId: string) => {
    return quotes.find(quote => quote.bomSendId === bomId);
  };
  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 40,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          height: "100%",
          width: "100%",
          maxWidth: "500px",
          backgroundColor: "white",
          border: "1px solid #e0e0e0",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "500",
                color: "#000",
                margin: 0,
              }}
            >
              {supplier.name}
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              {supplier.email}
            </Text>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              color: "#666",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px",
          }}
        >
          {showQuoteForm && selectedBom ? (
            // Quote Form
            <div>
              <div style={{ marginBottom: "24px" }}>
                <button
                  onClick={() => setShowQuoteForm(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#007bff",
                    cursor: "pointer",
                    fontSize: "14px",
                    marginBottom: "16px",
                  }}
                >
                  ← Back to BOMs
                </button>
                <Text style={{ fontSize: "18px", fontWeight: "600", color: "#333" }}>
                  Submit Quote for {selectedBom.bomNumber}
                </Text>
              </div>

              <div style={{ marginBottom: "24px" }}>
                {quoteItems.map((item, index) => (
                  <div key={item.itemId} style={{ 
                    border: "1px solid #eee", 
                    borderRadius: "8px", 
                    padding: "16px", 
                    marginBottom: "16px" 
                  }}>
                    <Text style={{ fontWeight: "600", marginBottom: "8px" }}>
                      {item.itemName}
                    </Text>
                    <Text style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
                      Quantity: {item.quantity} {item.unit}
                    </Text>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                          Unit Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quotedPrice}
                          onChange={(e) => handleQuoteItemChange(index, 'quotedPrice', parseFloat(e.target.value) || 0)}
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                          Lead Time
                        </label>
                        <input
                          type="text"
                          value={item.leadTime}
                          onChange={(e) => handleQuoteItemChange(index, 'leadTime', e.target.value)}
                          placeholder="e.g., 2 weeks"
                          style={{
                            width: "100%",
                            padding: "8px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>
                    
                    <div style={{ marginTop: "12px" }}>
                      <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                        Notes
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => handleQuoteItemChange(index, 'notes', e.target.value)}
                        placeholder="Additional notes for this item"
                        style={{
                          width: "100%",
                          padding: "8px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                    
                    <div style={{ marginTop: "8px", textAlign: "right" }}>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                        Total: ${(item.quotedPrice * item.quantity).toFixed(2)}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                      Total Quote Amount
                    </label>
                    <div style={{
                      padding: "8px",
                      backgroundColor: "#f8f9fa",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "16px",
                      fontWeight: "600",
                      color: "#333",
                    }}>
                      ${calculateTotal().toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: "12px", color: "#666", display: "block", marginBottom: "4px" }}>
                    Quote Notes
                  </label>
                  <textarea
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Additional notes for the entire quote"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "14px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <button
                onClick={submitQuote}
                disabled={submitting || calculateTotal() === 0}
                style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: submitting || calculateTotal() === 0 ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: submitting || calculateTotal() === 0 ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Submit Quote"}
              </button>
            </div>
          ) : boms.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "64px 0",
              }}
            >
              <Text style={{ color: "#666" }}>
                No BOMs sent to this supplier yet
              </Text>
            </div>
          ) : (
            <div>
              <Text
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#666",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "16px",
                }}
              >
                BOMs Received ({boms.length})
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {boms.map((bom) => {
                  const existingQuote = getBomQuote(bom.id);
                  return (
                    <div
                      key={bom.id}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: "8px",
                        padding: "16px",
                        transition: "box-shadow 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "12px",
                        }}
                      >
                        <div>
                          <Text
                            style={{
                              fontSize: "16px",
                              fontWeight: "600",
                              color: "#333",
                              margin: 0,
                            }}
                          >
                            {bom.bomNumber}
                          </Text>
                          <Text
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "4px",
                            }}
                          >
                            {new Date(bom.sentAt).toLocaleDateString()}
                          </Text>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              backgroundColor: existingQuote ? "#d4edda" : "#e3f2fd",
                              color: existingQuote ? "#155724" : "#1976d2",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {existingQuote ? "Quoted" : bom.status}
                          </span>
                          {existingQuote && (
                            <Text style={{ fontSize: "12px", fontWeight: "600", color: "#28a745" }}>
                              ${existingQuote.totalAmount.toFixed(2)}
                            </Text>
                          )}
                        </div>
                      </div>

                      <div style={{ marginBottom: "16px" }}>
                        <Text
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#666",
                            marginBottom: "8px",
                          }}
                        >
                          Items ({bom.items.length}):
                        </Text>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {bom.items.map((item) => (
                            <div key={item.id}>
                              <Text
                                style={{
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  color: "#333",
                                  margin: 0,
                                }}
                              >
                                {item.itemName}
                              </Text>
                              <Text
                                style={{
                                  fontSize: "12px",
                                  color: "#666",
                                  margin: 0,
                                }}
                              >
                                {item.quantity} {item.unit}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>

                      {existingQuote ? (
                        <div style={{ 
                          backgroundColor: "#f8f9fa", 
                          padding: "12px", 
                          borderRadius: "6px",
                          marginBottom: "12px"
                        }}>
                          <Text style={{ fontSize: "12px", fontWeight: "600", color: "#666", marginBottom: "8px" }}>
                            Your Quote Details:
                          </Text>
                          <Text style={{ fontSize: "12px", color: "#333" }}>
                            Submitted: {new Date(existingQuote.submittedAt).toLocaleDateString()}
                          </Text>
                          {existingQuote.validUntil && (
                            <Text style={{ fontSize: "12px", color: "#333" }}>
                              Valid Until: {new Date(existingQuote.validUntil).toLocaleDateString()}
                            </Text>
                          )}
                          {existingQuote.notes && (
                            <Text style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                              Notes: {existingQuote.notes}
                            </Text>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSubmitQuote(bom)}
                          style={{
                            width: "100%",
                            padding: "8px 16px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#218838";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#28a745";
                          }}
                        >
                          Submit Quote
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              padding: "12px 16px",
              backgroundColor: "white",
              color: "#000",
              border: "1px solid #e0e0e0",
              fontSize: "14px",
              fontWeight: "400",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f8f8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function BOMComparisonModal({
  bomNumbers,
  allBoms,
  allQuotes,
  suppliers,
  onClose,
}: {
  bomNumbers: string[];
  allBoms: BOMSend[];
  allQuotes: SupplierQuote[];
  suppliers: Supplier[];
  onClose: () => void;
}) {
  const [selectedBomNumber, setSelectedBomNumber] = useState<string>("");

  const getBomsByNumber = (bomNumber: string) => {
    return allBoms.filter(bom => bom.bomNumber === bomNumber);
  };

  const getQuotesByBomNumber = (bomNumber: string) => {
    const bomIds = getBomsByNumber(bomNumber).map(bom => bom.id);
    return allQuotes.filter(quote => bomIds.includes(quote.bomSendId));
  };

  const getSupplierName = (supplierId: string) => {
    return suppliers.find(s => s.id === supplierId)?.name || "Unknown";
  };

  const selectedBoms = selectedBomNumber ? getBomsByNumber(selectedBomNumber) : [];
  const selectedQuotes = selectedBomNumber ? getQuotesByBomNumber(selectedBomNumber) : [];

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 40,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "95%",
          maxWidth: "1400px",
          height: "90%",
          backgroundColor: "white",
          border: "1px solid #e0e0e0",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Text
              style={{
                fontSize: "20px",
                fontWeight: "500",
                color: "#000",
                margin: 0,
              }}
            >
              Compare BOM Quotes
            </Text>
            <Text
              style={{
                fontSize: "14px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              Compare supplier quotes for the same BOM
            </Text>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              color: "#666",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "24px",
            overflowY: "auto",
          }}
        >
          {/* BOM Selection */}
          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#333",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Select BOM to Compare:
            </label>
            <select
              value={selectedBomNumber}
              onChange={(e) => setSelectedBomNumber(e.target.value)}
              style={{
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                minWidth: "300px",
                backgroundColor: "white",
              }}
            >
              <option value="">Choose a BOM...</option>
              {bomNumbers.map((bomNumber) => {
                const bomCount = getBomsByNumber(bomNumber).length;
                const quoteCount = getQuotesByBomNumber(bomNumber).length;
                return (
                  <option key={bomNumber} value={bomNumber}>
                    {bomNumber} ({bomCount} sent, {quoteCount} quotes)
                  </option>
                );
              })}
            </select>
          </div>

          {selectedBomNumber && (
            <div>
              {/* BOM Details */}
              <div style={{ marginBottom: "32px" }}>
                <Text
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "16px",
                  }}
                >
                  BOM Details: {selectedBomNumber}
                </Text>
                
                {selectedBoms.length > 0 && (
                  <div style={{ 
                    backgroundColor: "#f8f9fa", 
                    padding: "16px", 
                    borderRadius: "8px",
                    marginBottom: "24px"
                  }}>
                    <Text style={{ fontSize: "14px", fontWeight: "600", color: "#333", marginBottom: "8px" }}>
                      Items in this BOM:
                    </Text>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
                      {selectedBoms[0].items.map((item) => (
                        <div key={item.id} style={{ 
                          backgroundColor: "white", 
                          padding: "12px", 
                          borderRadius: "6px",
                          border: "1px solid #e0e0e0"
                        }}>
                          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#333" }}>
                            {item.itemName}
                          </Text>
                          <Text style={{ fontSize: "12px", color: "#666" }}>
                            {item.quantity} {item.unit}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quotes Comparison */}
              {selectedQuotes.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "64px", 
                  backgroundColor: "#f8f9fa", 
                  borderRadius: "8px" 
                }}>
                  <Text style={{ color: "#666", fontSize: "16px" }}>
                    No quotes received for this BOM yet
                  </Text>
                  <Text style={{ color: "#999", fontSize: "14px", marginTop: "8px" }}>
                    Quotes will appear here once suppliers submit them
                  </Text>
                </div>
              ) : (
                <div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "24px" 
                  }}>
                    <Text
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        color: "#333",
                      }}
                    >
                      Supplier Quotes ({selectedQuotes.length})
                    </Text>
                    <div style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
                      <div>
                        <span style={{ color: "#666" }}>Lowest: </span>
                        <span style={{ fontWeight: "600", color: "#28a745" }}>
                          ${Math.min(...selectedQuotes.map(q => q.totalAmount)).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#666" }}>Highest: </span>
                        <span style={{ fontWeight: "600", color: "#dc3545" }}>
                          ${Math.max(...selectedQuotes.map(q => q.totalAmount)).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#666" }}>Average: </span>
                        <span style={{ fontWeight: "600", color: "#007bff" }}>
                          ${(selectedQuotes.reduce((sum, q) => sum + q.totalAmount, 0) / selectedQuotes.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1px", border: "1px solid #e0e0e0" }}>
                    {selectedQuotes
                      .sort((a, b) => a.totalAmount - b.totalAmount)
                      .map((quote, index) => {
                        const isLowest = quote.totalAmount === Math.min(...selectedQuotes.map(q => q.totalAmount));
                        
                        return (
                          <div
                            key={quote.id}
                            style={{
                              border: isLowest ? "2px solid #000" : "1px solid #e0e0e0",
                              padding: "24px",
                              backgroundColor: "white",
                              position: "relative",
                            }}
                          >
                            {isLowest && (
                              <div style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                backgroundColor: "#000",
                                color: "white",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              }}>
                                BEST PRICE
                              </div>
                            )}
                            
                            <div style={{ marginBottom: "16px" }}>
                              <Text style={{ fontSize: "16px", fontWeight: "500", color: "#000" }}>
                                {getSupplierName(quote.supplierId)}
                              </Text>
                              <Text style={{ fontSize: "12px", color: "#666" }}>
                                Submitted: {new Date(quote.submittedAt).toLocaleDateString()}
                              </Text>
                              {quote.validUntil && (
                                <Text style={{ fontSize: "12px", color: "#666" }}>
                                  Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                                </Text>
                              )}
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                              <Text style={{ 
                                fontSize: "24px", 
                                fontWeight: "300", 
                                color: "#000"
                              }}>
                                ${quote.totalAmount.toFixed(2)}
                              </Text>
                            </div>

                            <div style={{ marginBottom: "16px" }}>
                              <Text style={{ fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                Item Breakdown:
                              </Text>
                              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                {quote.items.map((item) => (
                                  <div key={item.itemId} style={{ 
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    padding: "6px 0",
                                    borderBottom: "1px solid #f0f0f0"
                                  }}>
                                    <div>
                                      <Text style={{ fontSize: "13px", fontWeight: "400", color: "#000" }}>
                                        {item.itemName}
                                      </Text>
                                      <Text style={{ fontSize: "11px", color: "#666" }}>
                                        {item.quantity} × ${item.quotedPrice.toFixed(2)}
                                        {item.leadTime && ` • ${item.leadTime}`}
                                      </Text>
                                    </div>
                                    <Text style={{ fontSize: "13px", fontWeight: "400", color: "#000" }}>
                                      ${item.totalPrice.toFixed(2)}
                                    </Text>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {quote.notes && (
                              <div style={{ 
                                backgroundColor: "#fafafa", 
                                padding: "12px", 
                                border: "1px solid #f0f0f0",
                                marginTop: "12px"
                              }}>
                                <Text style={{ fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                  Notes:
                                </Text>
                                <Text style={{ fontSize: "12px", color: "#000" }}>
                                  {quote.notes}
                                </Text>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              backgroundColor: "white",
              color: "#000",
              border: "1px solid #e0e0e0",
              fontSize: "14px",
              fontWeight: "400",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f8f8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "white";
            }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
     