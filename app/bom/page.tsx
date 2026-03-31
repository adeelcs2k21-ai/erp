"use client";

import { useState, useEffect } from "react";
import { Box, Button, Text, Table, Badge, Tabs, Modal, Drawer, TextInput, Select, NumberInput, Textarea, Group, ActionIcon, MultiSelect, Stack, Paper } from "@mantine/core";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBusinessType, setSelectedBusinessType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  // Filter suppliers based on search and filters
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch = searchQuery === "" || 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBusinessType = !selectedBusinessType || 
      (supplier.business_type || supplier.businessType) === selectedBusinessType;
    
    const matchesStatus = !selectedStatus || 
      (supplier.status || 'Active') === selectedStatus;
    
    return matchesSearch && matchesBusinessType && matchesStatus;
  });

  // Get unique business types for filter
  const businessTypes = ['Manufacturer', 'Distributor', 'Wholesaler', 'Service Provider'];
  const statuses = ['Active', 'Inactive'];

  const clearFilters = () => {
    setSelectedBusinessType(null);
    setSelectedStatus(null);
    setShowFilters(false);
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
      {/* Search and Filter Bar */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "10px 16px",
            fontSize: "13px",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            width: "280px",
            fontFamily: "Poppins, sans-serif",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = "#4a90e2"}
          onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
        />
        
        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: "10px 18px",
            backgroundColor: showFilters ? "#f5f5f5" : "white",
            color: "#1a1a1a",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            fontFamily: "Poppins, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!showFilters) e.currentTarget.style.backgroundColor = "#f5f5f5";
          }}
          onMouseLeave={(e) => {
            if (!showFilters) e.currentTarget.style.backgroundColor = "white";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="8" cy="6" r="2" fill="white" />
            <circle cx="16" cy="12" r="2" fill="white" />
            <circle cx="12" cy="18" r="2" fill="white" />
          </svg>
          Filter
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div style={{
          backgroundColor: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
        }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
            {/* Business Type Filter */}
            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "12px", 
                color: "#666", 
                marginBottom: "6px",
                fontFamily: "Poppins, sans-serif",
                fontWeight: "500"
              }}>
                Business Type
              </label>
              <select
                value={selectedBusinessType || ""}
                onChange={(e) => setSelectedBusinessType(e.target.value || null)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  fontFamily: "Poppins, sans-serif",
                  backgroundColor: "white",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="">All Types</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ 
                display: "block", 
                fontSize: "12px", 
                color: "#666", 
                marginBottom: "6px",
                fontFamily: "Poppins, sans-serif",
                fontWeight: "500"
              }}>
                Status
              </label>
              <select
                value={selectedStatus || ""}
                onChange={(e) => setSelectedStatus(e.target.value || null)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "13px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  fontFamily: "Poppins, sans-serif",
                  backgroundColor: "white",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="">All Status</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <button
              onClick={clearFilters}
              style={{
                padding: "10px 18px",
                backgroundColor: "white",
                color: "#666",
                border: "1px solid #e0e0e0",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500",
                cursor: "pointer",
                fontFamily: "Poppins, sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f5f5f5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      {filteredSuppliers.length === 0 ? (
        <Text style={{ color: "#999", fontSize: "14px", fontFamily: "Poppins, sans-serif", textAlign: "center", padding: "40px" }}>
          {suppliers.length === 0 ? "No suppliers yet." : "No suppliers match your search or filters."}
        </Text>
      ) : (
        <div style={{ backgroundColor: "white", border: "1px solid #e5e5e5", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Supplier</th>
                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Contact</th>
                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} style={{ borderBottom: "1px solid #f5f5f5", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fafafa"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td style={{ padding: "12px 14px", cursor: "pointer" }} onClick={() => { setSelectedSupplier(supplier); setShowSupplierDetail(true); }}>
                    <div style={{ fontWeight: "600", color: "#1a1a1a", marginBottom: "3px", fontSize: "13px", fontFamily: "Poppins, sans-serif" }}>{supplier.name}</div>
                    <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.4", fontFamily: "Poppins, sans-serif" }}>{supplier.address || "No address provided"}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontSize: "12px", color: "#333", marginBottom: "2px", fontFamily: "Poppins, sans-serif" }}>{supplier.email}</div>
                    <div style={{ fontSize: "11px", color: "#888", fontFamily: "Poppins, sans-serif" }}>{supplier.phone}</div>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={() => { setSelectedSupplier(supplier); setShowDrawer(true); }} style={{ padding: "6px 10px", backgroundColor: "white", color: "#1a1a1a", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer", borderRadius: "4px", fontFamily: "Poppins, sans-serif", fontWeight: "500", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>BOMs</button>
                      <button onClick={() => { setSelectedSupplier(supplier); setShowPOModal(true); }} style={{ padding: "6px 10px", backgroundColor: "white", color: "#1a1a1a", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer", borderRadius: "4px", fontFamily: "Poppins, sans-serif", fontWeight: "500", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>POs</button>
                      <button onClick={() => editSupplier(supplier)} style={{ padding: "6px 10px", backgroundColor: "white", color: "#1a1a1a", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer", borderRadius: "4px", fontFamily: "Poppins, sans-serif", fontWeight: "500", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#f5f5f5"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}>Edit</button>
                      <button onClick={() => { if (window.confirm(`Delete ${supplier.name}?`)) deleteSupplier(supplier.id); }} style={{ padding: "6px 10px", backgroundColor: "white", color: "#dc3545", border: "1px solid #e0e0e0", fontSize: "11px", cursor: "pointer", borderRadius: "4px", fontFamily: "Poppins, sans-serif", fontWeight: "500", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fee"; e.currentTarget.style.borderColor = "#dc3545"; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderColor = "#e0e0e0"; }}>Delete</button>
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
        <Modal 
          opened={showSupplierDetail} 
          onClose={() => setShowSupplierDetail(false)} 
          title={selectedSupplier.name}
          size="xl"
          styles={{
            title: {
              fontSize: '22px',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              color: '#1a1a1a'
            },
            header: {
              padding: '28px 32px',
              borderBottom: '1px solid #f0f0f0'
            },
            body: {
              padding: '0'
            },
            content: {
              maxWidth: '900px'
            }
          }}
        >
          <Tabs defaultValue="overview" styles={{
            root: { fontFamily: 'Poppins, sans-serif' },
            list: { 
              padding: '0 32px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              flexWrap: 'nowrap',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                display: 'none'
              }
            },
            tab: {
              fontSize: '14px',
              fontWeight: '500',
              padding: '14px 20px',
              whiteSpace: 'nowrap',
              flex: '0 0 auto'
            },
            panel: {
              padding: '32px'
            }
          }}>
            <Tabs.List>
              <Tabs.Tab value="overview">Overview</Tabs.Tab>
              <Tabs.Tab value="contact">Contact</Tabs.Tab>
              <Tabs.Tab value="business">Business</Tabs.Tab>
              <Tabs.Tab value="financial">Financial</Tabs.Tab>
              <Tabs.Tab value="supply">Supply</Tabs.Tab>
              <Tabs.Tab value="logistics">Logistics</Tabs.Tab>
              <Tabs.Tab value="performance">Performance</Tabs.Tab>
            </Tabs.List>

            {/* Overview Tab */}
            <Tabs.Panel value="overview">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.image_url || selectedSupplier.imageUrl) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Supplier Logo</Text>
                    <img 
                      src={selectedSupplier.image_url || selectedSupplier.imageUrl} 
                      alt={`${selectedSupplier.name} logo`}
                      style={{ 
                        maxWidth: '250px', 
                        maxHeight: '120px', 
                        objectFit: 'contain', 
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        padding: '8px',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const modal = document.createElement('div');
                        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;cursor:pointer;padding:20px';
                        modal.onclick = () => modal.remove();
                        const img = document.createElement('img');
                        img.src = selectedSupplier.image_url || selectedSupplier.imageUrl;
                        img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain;border-radius:8px';
                        modal.appendChild(img);
                        document.body.appendChild(modal);
                      }}
                    />
                  </div>
                )}
                <div>
                  <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Business Type</Text>
                  <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.business_type || selectedSupplier.businessType || '—'}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Email</Text>
                  <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.email || '—'}</Text>
                </div>
                <div>
                  <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Phone</Text>
                  <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.phone || '—'}</Text>
                </div>
                {selectedSupplier.address && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Address</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', lineHeight: '1.6' }}>{selectedSupplier.address}</Text>
                  </div>
                )}
                {(selectedSupplier.contact_person || selectedSupplier.contactPerson) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Contact Person</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.contact_person || selectedSupplier.contactPerson}</Text>
                  </div>
                )}
              </div>
            </Tabs.Panel>

            {/* Contact Tab */}
            <Tabs.Panel value="contact">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.alternate_phone || selectedSupplier.alternatePhone) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Alternate Phone</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.alternate_phone || selectedSupplier.alternatePhone}</Text>
                  </div>
                )}
                {(selectedSupplier.whatsapp_number || selectedSupplier.whatsappNumber) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>WhatsApp Number</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.whatsapp_number || selectedSupplier.whatsappNumber}</Text>
                  </div>
                )}
                {selectedSupplier.website && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Website</Text>
                    <Text style={{ fontSize: '15px', fontWeight: '500', color: '#007bff' }}><a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer">{selectedSupplier.website}</a></Text>
                  </div>
                )}
                {(selectedSupplier.contact_person_designation || selectedSupplier.contactPersonDesignation) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Contact Person Designation</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.contact_person_designation || selectedSupplier.contactPersonDesignation}</Text>
                  </div>
                )}
                {!selectedSupplier.alternate_phone && !selectedSupplier.alternatePhone && !selectedSupplier.whatsapp_number && !selectedSupplier.whatsappNumber && !selectedSupplier.website && !selectedSupplier.contact_person_designation && !selectedSupplier.contactPersonDesignation && (
                  <Text style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No additional contact details available</Text>
                )}
              </div>
            </Tabs.Panel>

            {/* Business Tab */}
            <Tabs.Panel value="business">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.company_registration_number || selectedSupplier.companyRegistrationNumber) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Company Registration Number</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.company_registration_number || selectedSupplier.companyRegistrationNumber}</Text>
                  </div>
                )}
                {selectedSupplier.ntn && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>NTN (Tax Number)</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.ntn}</Text>
                  </div>
                )}
                {selectedSupplier.strn && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>STRN (Sales Tax)</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.strn}</Text>
                  </div>
                )}
                {(selectedSupplier.license_number || selectedSupplier.licenseNumber) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>License Number</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.license_number || selectedSupplier.licenseNumber}</Text>
                  </div>
                )}
                {!selectedSupplier.company_registration_number && !selectedSupplier.companyRegistrationNumber && !selectedSupplier.ntn && !selectedSupplier.strn && !selectedSupplier.license_number && !selectedSupplier.licenseNumber && (
                  <Text style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No business information available</Text>
                )}
              </div>
            </Tabs.Panel>

            {/* Financial Tab */}
            <Tabs.Panel value="financial">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.bank_name || selectedSupplier.bankName) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Bank Name</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.bank_name || selectedSupplier.bankName}</Text>
                  </div>
                )}
                {(selectedSupplier.bank_account_number || selectedSupplier.bankAccountNumber) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Bank Account Number</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.bank_account_number || selectedSupplier.bankAccountNumber}</Text>
                  </div>
                )}
                {selectedSupplier.iban && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>IBAN</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.iban}</Text>
                  </div>
                )}
                {(selectedSupplier.payment_terms || selectedSupplier.paymentTerms) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Payment Terms</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.payment_terms || selectedSupplier.paymentTerms}</Text>
                  </div>
                )}
                {(selectedSupplier.credit_limit || selectedSupplier.creditLimit) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Credit Limit</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>PKR {selectedSupplier.credit_limit || selectedSupplier.creditLimit}</Text>
                  </div>
                )}
                {selectedSupplier.currency && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Currency</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.currency}</Text>
                  </div>
                )}
                {!selectedSupplier.bank_name && !selectedSupplier.bankName && !selectedSupplier.bank_account_number && !selectedSupplier.bankAccountNumber && !selectedSupplier.iban && !selectedSupplier.payment_terms && !selectedSupplier.paymentTerms && !selectedSupplier.credit_limit && !selectedSupplier.creditLimit && (
                  <Text style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No financial information available</Text>
                )}
              </div>
            </Tabs.Panel>

            {/* Supply Tab */}
            <Tabs.Panel value="supply">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.materials_supplied || selectedSupplier.materialsSupplied) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Materials Supplied</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', lineHeight: '1.6' }}>{selectedSupplier.materials_supplied || selectedSupplier.materialsSupplied}</Text>
                  </div>
                )}
                {(selectedSupplier.minimum_order_quantity || selectedSupplier.minimumOrderQuantity) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Minimum Order Quantity (MOQ)</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.minimum_order_quantity || selectedSupplier.minimumOrderQuantity}</Text>
                  </div>
                )}
                {(selectedSupplier.lead_time || selectedSupplier.leadTime) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Lead Time</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.lead_time || selectedSupplier.leadTime}</Text>
                  </div>
                )}
                {(selectedSupplier.delivery_areas || selectedSupplier.deliveryAreas) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Delivery Areas</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', lineHeight: '1.6' }}>{selectedSupplier.delivery_areas || selectedSupplier.deliveryAreas}</Text>
                  </div>
                )}
                {!selectedSupplier.materials_supplied && !selectedSupplier.materialsSupplied && !selectedSupplier.minimum_order_quantity && !selectedSupplier.minimumOrderQuantity && !selectedSupplier.lead_time && !selectedSupplier.leadTime && !selectedSupplier.delivery_areas && !selectedSupplier.deliveryAreas && (
                  <Text style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No supply information available</Text>
                )}
              </div>
            </Tabs.Panel>

            {/* Logistics Tab */}
            <Tabs.Panel value="logistics">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.delivery_method || selectedSupplier.deliveryMethod) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Delivery Method</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.delivery_method || selectedSupplier.deliveryMethod}</Text>
                  </div>
                )}
                {(selectedSupplier.transport_charges_policy || selectedSupplier.transportChargesPolicy) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Transport Charges Policy</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', lineHeight: '1.6' }}>{selectedSupplier.transport_charges_policy || selectedSupplier.transportChargesPolicy}</Text>
                  </div>
                )}
                {(selectedSupplier.warehouse_location || selectedSupplier.warehouseLocation) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Warehouse Location</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', lineHeight: '1.6' }}>{selectedSupplier.warehouse_location || selectedSupplier.warehouseLocation}</Text>
                  </div>
                )}
                {!selectedSupplier.delivery_method && !selectedSupplier.deliveryMethod && !selectedSupplier.transport_charges_policy && !selectedSupplier.transportChargesPolicy && !selectedSupplier.warehouse_location && !selectedSupplier.warehouseLocation && (
                  <Text style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No logistics information available</Text>
                )}
              </div>
            </Tabs.Panel>

            {/* Performance Tab */}
            <Tabs.Panel value="performance">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {(selectedSupplier.supplier_rating || selectedSupplier.supplierRating) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Supplier Rating</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{'⭐'.repeat(parseInt(selectedSupplier.supplier_rating || selectedSupplier.supplierRating || '0'))}</Text>
                  </div>
                )}
                {(selectedSupplier.reliability_score || selectedSupplier.reliabilityScore) && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Reliability Score</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>{selectedSupplier.reliability_score || selectedSupplier.reliabilityScore}</Text>
                  </div>
                )}
                {selectedSupplier.notes && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Notes / Remarks</Text>
                    <Text style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a', lineHeight: '1.6' }}>{selectedSupplier.notes}</Text>
                  </div>
                )}
                {selectedSupplier.status && (
                  <div>
                    <Text style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: '500' }}>Status</Text>
                    <Badge color={selectedSupplier.status === 'Active' ? 'green' : selectedSupplier.status === 'Inactive' ? 'gray' : 'red'}>{selectedSupplier.status}</Badge>
                  </div>
                )}
                {!selectedSupplier.supplier_rating && !selectedSupplier.supplierRating && !selectedSupplier.reliability_score && !selectedSupplier.reliabilityScore && !selectedSupplier.notes && (
                  <Text style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No performance information available</Text>
                )}
              </div>
            </Tabs.Panel>
          </Tabs>

          {/* Actions Footer */}
          <div style={{ 
            padding: '20px 32px', 
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <Button
              onClick={() => { 
                setShowSupplierDetail(false); 
                setSelectedSupplier(selectedSupplier); 
                setShowDrawer(true); 
              }}
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 24px',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              View BOMs
            </Button>
            <Button
              onClick={() => { 
                setShowSupplierDetail(false); 
                setSelectedSupplier(selectedSupplier); 
                setShowPOModal(true); 
              }}
              style={{
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 24px',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              View POs
            </Button>
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
  const [showPdfOptionsModal, setShowPdfOptionsModal] = useState(false);
  const [pendingPdfOrder, setPendingPdfOrder] = useState<any>(null);
  const [selectedSupplierForBOMs, setSelectedSupplierForBOMs] = useState<any>(null);
  const [showSupplierBOMs, setShowSupplierBOMs] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [selectedBOMForQuote, setSelectedBOMForQuote] = useState<any>(null);
  const [isCreatingBOM, setIsCreatingBOM] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [supplierFormTab, setSupplierFormTab] = useState<string | null>('basic');
  
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
    // Basic Information
    name: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    businessType: '',
    imageUrl: '',
    
    // Additional Contact Details
    alternatePhone: '',
    whatsappNumber: '',
    website: '',
    contactPersonDesignation: '',
    
    // Business & Legal Info
    companyRegistrationNumber: '',
    ntn: '',
    strn: '',
    licenseNumber: '',
    
    // Financial Details
    bankName: '',
    bankAccountNumber: '',
    iban: '',
    paymentTerms: '',
    creditLimit: '',
    currency: 'PKR',
    
    // Supply Capabilities
    materialsSupplied: '',
    minimumOrderQuantity: '',
    leadTime: '',
    deliveryAreas: '',
    
    // Logistics Info
    deliveryMethod: '',
    transportChargesPolicy: '',
    warehouseLocation: '',
    
    // Performance & Internal Use
    supplierRating: '',
    reliabilityScore: '',
    notes: '',
    
    // System Fields
    status: 'Active'
  });

  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      businessType: '',
      imageUrl: '',
      alternatePhone: '',
      whatsappNumber: '',
      website: '',
      contactPersonDesignation: '',
      companyRegistrationNumber: '',
      ntn: '',
      strn: '',
      licenseNumber: '',
      bankName: '',
      bankAccountNumber: '',
      iban: '',
      paymentTerms: '',
      creditLimit: '',
      currency: 'PKR',
      materialsSupplied: '',
      minimumOrderQuantity: '',
      leadTime: '',
      deliveryAreas: '',
      deliveryMethod: '',
      transportChargesPolicy: '',
      warehouseLocation: '',
      supplierRating: '',
      reliabilityScore: '',
      notes: '',
      status: 'Active'
    });
  };

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    itemRates: {} as {[key: string]: {unitPrice: number, totalPrice: number}},
    transportCost: 0,
    tax: 0,
    validUntil: '',
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOrders(),
        fetchBOMRates(),
        fetchSuppliers(),
        fetchNotifications()
      ]);
      setLoading(false);
    };
    loadData();
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
      setIsCreatingBOM(true);
      
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const createdBy = user.username || "unknown";
      
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
          createdBy: createdBy
        })
      });

      if (response.ok) {
        setSuccessMessage('BOM created successfully!');
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 3000);
        
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
    } finally {
      setIsCreatingBOM(false);
    }
  };

  const downloadBOMPDF = async (order: any, includeSuppliers: boolean = true) => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      
      // Add Logo
      try {
        const logoImg = new Image();
        logoImg.src = '/logo.png';
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 2000);
        });
        doc.addImage(logoImg, 'PNG', 15, 10, 30, 30);
      } catch (e) {
        console.log('Logo not loaded, continuing without it');
      }
      
      // Company Name & Header
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 26);
      doc.text('Voltrix', 50, 20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(102, 102, 102);
      doc.text('Battery Manufacturing Solutions', 50, 26);
      
      // Document Title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 26);
      doc.text('BILL OF MATERIALS', 105, 48, { align: 'center' });
      
      // Divider Line
      doc.setDrawColor(229, 229, 229);
      doc.setLineWidth(0.5);
      doc.line(15, 52, 195, 52);
      
      // BOM Details Table - Compact
      const detailsData = [
        ['BOM NUMBER', order.poNumber, 'STATUS', order.status.replace(/_/g, ' ').toUpperCase()],
        ['EXPECTED DELIVERY', new Date(order.deliveryDate).toLocaleDateString(), 'CREATED BY', order.createdBy],
        ['PAYMENT TERMS', order.paymentTerms || 'N/A', '', '']
      ];
      
      autoTable(doc, {
        startY: 58,
        body: detailsData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 4,
          lineColor: [245, 245, 245],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { 
            cellWidth: 45, 
            fontStyle: 'bold', 
            textColor: [153, 153, 153],
            fontSize: 8
          },
          1: { 
            cellWidth: 50, 
            textColor: [26, 26, 26],
            fontStyle: 'normal'
          },
          2: { 
            cellWidth: 45, 
            fontStyle: 'bold', 
            textColor: [153, 153, 153],
            fontSize: 8
          },
          3: { 
            cellWidth: 40, 
            textColor: [26, 26, 26],
            fontStyle: 'normal'
          }
        },
        margin: { left: 15, right: 15 },
        didDrawCell: (data: any) => {
          // Highlight status cell
          if (data.column.index === 3 && data.row.index === 0) {
            doc.setFillColor(254, 243, 199);
            doc.setTextColor(146, 64, 14);
          }
        }
      });
      
      // Get position after details table
      let yPos = (doc as any).lastAutoTable.finalY + 12;
      
      // Items Section with autoTable
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 26, 26);
      doc.text('Items', 15, yPos);
      
      // Prepare table data
      const tableData = order.items.map((item: any) => [
        item.itemName,
        item.itemType,
        item.quantity.toString(),
        item.unit
      ]);
      
      // Generate items table
      autoTable(doc, {
        startY: yPos + 3,
        head: [['ITEM NAME', 'TYPE', 'QTY', 'UNIT']],
        body: tableData,
        theme: 'plain',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 5,
          textColor: [26, 26, 26],
          lineColor: [229, 229, 229],
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: [250, 250, 250],
          textColor: [102, 102, 102],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 75 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 30 }
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        },
        margin: { left: 15, right: 15 }
      });
      
      // Get the final Y position after the table
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Notes Section
      if (order.notes) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 26, 26);
        doc.text('Notes', 15, yPos);
        
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(102, 102, 102);
        const splitNotes = doc.splitTextToSize(order.notes, 170);
        doc.text(splitNotes, 15, yPos);
        yPos += splitNotes.length * 4.5;
      }
      
      // Suppliers Section - Only if includeSuppliers is true
      if (includeSuppliers && order.suppliers && order.suppliers.length > 0) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(26, 26, 26);
        doc.text('Suppliers', 15, yPos);
        
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(102, 102, 102);
        order.suppliers.forEach((supplier: any) => {
          doc.text(`• ${supplier.name} (${supplier.phone})`, 18, yPos);
          yPos += 5;
        });
      }
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(153, 153, 153);
        doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
        doc.text('Generated by Voltrix ERP System', 105, 290, { align: 'center' });
      }
      
      // Save PDF
      doc.save(`BOM-${order.poNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF');
    }
  };

  const submitSupplier = async () => {
    try {
      setIsSubmittingSupplier(true);
      
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
        setSuccessMessage(`Supplier ${editingSupplier ? 'updated' : 'created'} successfully!`);
        setShowSuccessNotification(true);
        setTimeout(() => setShowSuccessNotification(false), 3000);
        
        resetSupplierForm();
        setShowSupplierForm(false);
        setEditingSupplier(null);
        fetchSuppliers();
      } else {
        const errorData = await response.json();
        console.error('Supplier error:', errorData);
        alert(`Failed to ${editingSupplier ? 'update' : 'create'} supplier: ${errorData.error || 'Unknown error'}\n\nIf you see a column error, please run the SQL migration in update-suppliers-table.sql`);
      }
    } catch (error) {
      console.error('Error with supplier:', error);
      alert('Error with supplier operation. Check console for details.');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  const editSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || supplier.contact_person || '',
      businessType: supplier.businessType || supplier.business_type || '',
      imageUrl: supplier.imageUrl || supplier.image_url || '',
      alternatePhone: supplier.alternatePhone || supplier.alternate_phone || '',
      whatsappNumber: supplier.whatsappNumber || supplier.whatsapp_number || '',
      website: supplier.website || '',
      contactPersonDesignation: supplier.contactPersonDesignation || supplier.contact_person_designation || '',
      companyRegistrationNumber: supplier.companyRegistrationNumber || supplier.company_registration_number || '',
      ntn: supplier.ntn || '',
      strn: supplier.strn || '',
      licenseNumber: supplier.licenseNumber || supplier.license_number || '',
      bankName: supplier.bankName || supplier.bank_name || '',
      bankAccountNumber: supplier.bankAccountNumber || supplier.bank_account_number || '',
      iban: supplier.iban || '',
      paymentTerms: supplier.paymentTerms || supplier.payment_terms || '',
      creditLimit: supplier.creditLimit || supplier.credit_limit || '',
      currency: supplier.currency || 'PKR',
      materialsSupplied: supplier.materialsSupplied || supplier.materials_supplied || '',
      minimumOrderQuantity: supplier.minimumOrderQuantity || supplier.minimum_order_quantity || '',
      leadTime: supplier.leadTime || supplier.lead_time || '',
      deliveryAreas: supplier.deliveryAreas || supplier.delivery_areas || '',
      deliveryMethod: supplier.deliveryMethod || supplier.delivery_method || '',
      transportChargesPolicy: supplier.transportChargesPolicy || supplier.transport_charges_policy || '',
      warehouseLocation: supplier.warehouseLocation || supplier.warehouse_location || '',
      supplierRating: supplier.supplierRating || supplier.supplier_rating || '',
      reliabilityScore: supplier.reliabilityScore || supplier.reliability_score || '',
      notes: supplier.notes || '',
      status: supplier.status || 'Active'
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
            {loading ? (
              <Box style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '400px',
                gap: '24px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #007bff',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <Text style={{ 
                  fontSize: '16px', 
                  color: '#666',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Loading Bills of Material...
                </Text>
                <style jsx>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </Box>
            ) : (
            <Tabs value={activeTab} onChange={setActiveTab}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Tabs.List style={{ border: 'none' }}>
                  <Tabs.Tab value="po">Bills of Material</Tabs.Tab>
                  <Tabs.Tab value="suppliers">Suppliers</Tabs.Tab>
                </Tabs.List>
                
                <button
                  onClick={() => {
                    if (activeTab === 'suppliers') {
                      setShowSupplierForm(true);
                    } else {
                      setShowForm(true);
                    }
                  }}
                  style={{
                    backgroundColor: "transparent",
                    color: "#1a1a1a",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "none",
                    padding: "0",
                    cursor: "pointer",
                    textDecoration: "none",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = "underline";
                    e.currentTarget.style.textDecorationStyle = "dotted";
                    e.currentTarget.style.textUnderlineOffset = "4px";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = "none";
                  }}
                >
                  {activeTab === 'suppliers' ? '+ Supplier' : '+ BOM'}
                </button>
              </div>

              <Tabs.Panel value="po" pt="md">
                <Tabs defaultValue="all">
                  <Tabs.List>
                    <Tabs.Tab value="all">All BOMs ({orders.length})</Tabs.Tab>
                    <Tabs.Tab value="pending">Pending ({pendingOrders.length})</Tabs.Tab>
                    <Tabs.Tab value="sent_to_finance">Sent to Finance ({sentToFinanceOrders.length})</Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="all" pt="md">
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
                                  <Badge color={getStatusColor(displayStatus)} variant="outline">
                                    {displayStatus.replace(/_/g, " ")}
                                  </Badge>
                                </Table.Td>
                                <Table.Td>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                      onClick={() => {
                                        setSelectedPO(order);
                                        setShowApprovalModal(true);
                                      }}
                                      style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "opacity 0.2s"
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
                                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                      title="View Details"
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPendingPdfOrder(order);
                                        setShowPdfOptionsModal(true);
                                      }}
                                      style={{
                                        backgroundColor: "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "opacity 0.2s"
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
                                      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                      title="Download PDF"
                                    >
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="12" y1="18" x2="12" y2="12"></line>
                                        <line x1="9" y1="15" x2="12" y2="18"></line>
                                        <line x1="15" y1="15" x2="12" y2="18"></line>
                                      </svg>
                                    </button>
                                  </div>
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="pending" pt="md">
                    {pendingOrders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>No pending Bills of Material.</Text>
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
                                <Badge color={getStatusColor(order.status)} variant="outline">
                                  {order.status.replace(/_/g, " ")}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    onClick={() => {
                                      setSelectedPO(order);
                                      setShowApprovalModal(true);
                                    }}
                                    style={{
                                      backgroundColor: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "opacity 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                    title="View Details"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                      <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPendingPdfOrder(order);
                                      setShowPdfOptionsModal(true);
                                    }}
                                    style={{
                                      backgroundColor: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "6px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "opacity 0.2s"
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                                    title="Download PDF"
                                  >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                      <polyline points="14 2 14 8 20 8"></polyline>
                                      <line x1="12" y1="18" x2="12" y2="12"></line>
                                      <line x1="9" y1="15" x2="12" y2="18"></line>
                                      <line x1="15" y1="15" x2="12" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="sent_to_finance" pt="md">
                    {sentToFinanceOrders.length === 0 ? (
                      <Text style={{ color: "#999", fontSize: "14px", textAlign: "center", padding: "40px" }}>No Bills of Material sent to finance yet.</Text>
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
                                <Badge color={getStatusColor('sent_to_finance')} variant="outline">
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
            )}
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
          body: { padding: 0 },
          content: { maxWidth: '1000px' }
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
            padding: '32px 40px',
            backgroundColor: 'white',
            borderBottom: '1px solid #e5e5e5'
          }}>
            <Text style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              color: '#1a1a1a',
              fontFamily: 'Poppins, sans-serif',
              marginBottom: '4px'
            }}>
              Create New BOM
            </Text>
            <Text style={{ 
              fontSize: '12px', 
              color: '#888',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Create a new Bill of Material and send to suppliers
            </Text>
          </Box>

          {/* Content */}
          <Box style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '0'
          }}>
            <Box style={{
              padding: '24px 32px',
              backgroundColor: 'white'
            }}>
              {/* Details Section - FIRST */}
              <Box style={{ marginBottom: '24px' }}>
                <Text style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: '#1a1a1a',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Details
                </Text>
                
                <Stack gap="14px">
                  <TextInput
                    label="Delivery Date"
                    type="date"
                    value={bomForm.deliveryDate}
                    onChange={(e) => setBomForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#444',
                        marginBottom: '6px',
                        fontFamily: 'Poppins, sans-serif'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        padding: '10px 12px',
                        height: '40px',
                        backgroundColor: 'white'
                      }
                    }}
                    required
                  />
                  
                  <TextInput
                    label="Payment Terms"
                    placeholder="e.g., Net 30 days, Advance payment"
                    value={bomForm.paymentTerms}
                    onChange={(e) => setBomForm(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    styles={{
                      label: { 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#444',
                        marginBottom: '6px',
                        fontFamily: 'Poppins, sans-serif'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        padding: '10px 12px',
                        height: '40px',
                        backgroundColor: 'white'
                      }
                    }}
                  />
                  
                  <Textarea
                    label="Notes"
                    placeholder="Additional notes, requirements, or special instructions"
                    value={bomForm.notes}
                    onChange={(e) => setBomForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    styles={{
                      label: { 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#444',
                        marginBottom: '6px',
                        fontFamily: 'Poppins, sans-serif'
                      },
                      input: { 
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        padding: '10px 12px',
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Stack>
              </Box>

              {/* Divider */}
              <Box style={{ 
                height: '1px', 
                backgroundColor: '#e5e5e5', 
                margin: '24px 0' 
              }} />

              {/* Items Section - SECOND */}
              <Box style={{ marginBottom: '24px' }}>
                <Text style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: '#1a1a1a',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Items
                </Text>
                
                <Stack gap="12px">
                  {bomForm.items.map((item, index) => (
                    <Paper key={index} style={{ 
                      padding: '16px',
                      backgroundColor: '#fafafa',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px'
                    }}>
                      <Group style={{ marginBottom: '12px', alignItems: 'flex-end', gap: '12px' }}>
                        <TextInput
                          label="Item Name"
                          placeholder="Enter item name"
                          value={item.itemName}
                          onChange={(e) => updateBomItem(index, 'itemName', e.target.value)}
                          style={{ flex: 1 }}
                          styles={{
                            label: { 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#444',
                              marginBottom: '6px',
                              fontFamily: 'Poppins, sans-serif'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '13px',
                              padding: '10px 12px',
                              height: '38px',
                              backgroundColor: 'white'
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
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#444',
                              marginBottom: '6px',
                              fontFamily: 'Poppins, sans-serif'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '13px',
                              height: '38px',
                              backgroundColor: 'white'
                            }
                          }}
                        />
                      </Group>
                      
                      <Group style={{ alignItems: 'flex-end', gap: '12px' }}>
                        <NumberInput
                          label="Quantity"
                          value={item.quantity}
                          onChange={(value) => updateBomItem(index, 'quantity', value || 1)}
                          min={1}
                          style={{ width: '100px' }}
                          styles={{
                            label: { 
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#444',
                              marginBottom: '6px',
                              fontFamily: 'Poppins, sans-serif'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '13px',
                              height: '38px',
                              backgroundColor: 'white'
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
                              fontSize: '12px', 
                              fontWeight: '600', 
                              color: '#444',
                              marginBottom: '6px',
                              fontFamily: 'Poppins, sans-serif'
                            },
                            input: { 
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '13px',
                              height: '38px',
                              backgroundColor: 'white'
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
                              padding: '0 16px',
                              height: '38px',
                              fontWeight: '500'
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
                    border: '2px dashed #007bff',
                    borderRadius: '6px',
                    marginTop: '12px',
                    fontSize: '13px',
                    fontWeight: '600',
                    height: '38px',
                    width: '100%'
                  }}
                >
                  + Add Another Item
                </Button>
              </Box>

              {/* Divider */}
              <Box style={{ 
                height: '1px', 
                backgroundColor: '#e5e5e5', 
                margin: '24px 0' 
              }} />

              {/* Suppliers Section - THIRD */}
              <Box>
                <Text style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  marginBottom: '16px',
                  color: '#1a1a1a',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  Suppliers
                </Text>
                
                <MultiSelect
                  placeholder="Select suppliers to send this BOM"
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
                      fontSize: '13px',
                      minHeight: '40px',
                      padding: '6px 12px',
                      backgroundColor: 'white'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box style={{ 
            padding: '18px 32px',
            backgroundColor: 'white',
            borderTop: '1px solid #e5e5e5',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.04)'
          }}>
            <Group style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                onClick={() => setShowForm(false)}
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  padding: '0 24px',
                  height: '40px'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitBOM}
                disabled={!bomForm.deliveryDate || bomForm.items.some(item => !item.itemName) || isCreatingBOM}
                style={{ 
                  backgroundColor: isCreatingBOM ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '0 28px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: isCreatingBOM ? 'not-allowed' : 'pointer'
                }}
              >
                {isCreatingBOM && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #ffffff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                )}
                {isCreatingBOM ? 'Creating BOM...' : 'Create BOM'}
              </Button>
            </Group>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </Box>
        </Box>
      </Drawer>

      {/* Supplier Creation/Edit Drawer */}
      <Drawer
        opened={showSupplierForm}
        onClose={() => {
          setShowSupplierForm(false);
          setEditingSupplier(null);
          resetSupplierForm();
        }}
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
            padding: 'clamp(16px, 4vw, 32px)',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e5e5e5'
          }}>
            <Text style={{ 
              fontSize: 'clamp(20px, 3vw, 24px)', 
              fontWeight: '600', 
              color: '#1a1a1a',
              fontFamily: 'Poppins, sans-serif',
              marginBottom: '6px'
            }}>
              {editingSupplier ? "Edit Supplier" : "Add New Supplier"}
            </Text>
            <Text style={{ 
              fontSize: 'clamp(12px, 2vw, 14px)', 
              color: '#666',
              fontFamily: 'Poppins, sans-serif'
            }}>
              {editingSupplier ? "Update supplier information" : "Add a new supplier to your network"}
            </Text>
          </Box>

          {/* Content with Tabs */}
          <Box style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(16px, 4vw, 32px)',
            backgroundColor: '#fafafa'
          }}>
            <Box style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: 'clamp(16px, 3vw, 32px)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <Tabs value={supplierFormTab} onChange={setSupplierFormTab} styles={{
                root: {
                  display: 'flex',
                  flexDirection: 'column'
                },
                list: {
                  borderBottom: '2px solid #f0f0f0',
                  marginBottom: 'clamp(16px, 3vw, 32px)',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  flexWrap: 'nowrap'
                },
                tab: {
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  fontWeight: '500',
                  fontFamily: 'Poppins, sans-serif',
                  padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 24px)',
                  whiteSpace: 'nowrap',
                  '&[data-active]': {
                    borderColor: '#007bff',
                    color: '#007bff'
                  }
                },
                panel: {
                  paddingTop: 0
                }
              }}>
                <Tabs.List>
                  <Tabs.Tab value="basic">Basic Info</Tabs.Tab>
                  <Tabs.Tab value="contact">Contact</Tabs.Tab>
                  <Tabs.Tab value="business">Business</Tabs.Tab>
                  <Tabs.Tab value="financial">Financial</Tabs.Tab>
                  <Tabs.Tab value="supply">Supply</Tabs.Tab>
                  <Tabs.Tab value="logistics">Logistics</Tabs.Tab>
                  <Tabs.Tab value="performance">Performance</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="basic">
                  <Stack gap="20px">
                    <TextInput label="Supplier Name" placeholder="Enter supplier name" value={supplierForm.name} onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))} styles={{ label: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', padding: '12px 14px', height: '44px', fontFamily: 'Poppins, sans-serif', backgroundColor: '#fafafa' } }} required />
                    <Group grow>
                      <TextInput label="Email" type="email" placeholder="supplier@example.com" value={supplierForm.email} onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))} styles={{ label: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', padding: '12px 14px', height: '44px', fontFamily: 'Poppins, sans-serif', backgroundColor: '#fafafa' } }} required />
                      <TextInput label="Phone" placeholder="+92 300 1234567" value={supplierForm.phone} onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))} styles={{ label: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', padding: '12px 14px', height: '44px', fontFamily: 'Poppins, sans-serif', backgroundColor: '#fafafa' } }} required />
                    </Group>
                    <Textarea label="Address" placeholder="Enter complete address" value={supplierForm.address} onChange={(e) => setSupplierForm(prev => ({ ...prev, address: e.target.value }))} rows={3} styles={{ label: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', padding: '12px 14px', fontFamily: 'Poppins, sans-serif', backgroundColor: '#fafafa' } }} />
                    <Group grow>
                      <TextInput label="Contact Person" placeholder="Primary contact name" value={supplierForm.contactPerson} onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))} styles={{ label: { fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', padding: '12px 14px', height: '44px', fontFamily: 'Poppins, sans-serif', backgroundColor: '#fafafa' } }} />
                    <Select label="Business Type" placeholder="Select type" value={supplierForm.businessType} onChange={(value) => setSupplierForm(prev => ({ ...prev, businessType: value || '' }))} data={[{ value: 'Manufacturer', label: 'Manufacturer' }, { value: 'Distributor', label: 'Distributor' }, { value: 'Wholesaler', label: 'Wholesaler' }, { value: 'Service Provider', label: 'Service Provider' }]} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <Box>
                    <Text style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a', marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }}>Supplier Logo / Image (Optional)</Text>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Show loading state
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setSupplierForm(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      style={{ 
                        display: 'block',
                        width: '100%',
                        padding: '12px 14px',
                        border: '2px dashed #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'Poppins, sans-serif',
                        backgroundColor: '#fafafa',
                        cursor: 'pointer'
                      }}
                    />
                    {supplierForm.imageUrl && (
                      <Box style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <Text style={{ fontSize: '12px', color: '#666', fontFamily: 'Poppins, sans-serif' }}>Preview:</Text>
                          <Button
                            onClick={() => setSupplierForm(prev => ({ ...prev, imageUrl: '' }))}
                            style={{ 
                              backgroundColor: 'transparent',
                              color: '#dc3545',
                              border: 'none',
                              fontSize: '12px',
                              padding: '4px 8px',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <img 
                          src={supplierForm.imageUrl} 
                          alt="Supplier logo preview" 
                          style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain', borderRadius: '6px', cursor: 'pointer' }}
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;cursor:pointer';
                            modal.onclick = () => modal.remove();
                            const img = document.createElement('img');
                            img.src = supplierForm.imageUrl;
                            img.style.cssText = 'max-width:90%;max-height:90%;object-fit:contain';
                            modal.appendChild(img);
                            document.body.appendChild(modal);
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="contact" pt="md">
                <Stack gap="16px">
                  <Group grow>
                    <TextInput label="Alternate Phone" placeholder="+92 321 1234567" value={supplierForm.alternatePhone} onChange={(e) => setSupplierForm(prev => ({ ...prev, alternatePhone: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                    <TextInput label="WhatsApp Number" placeholder="+92 300 1234567" value={supplierForm.whatsappNumber} onChange={(e) => setSupplierForm(prev => ({ ...prev, whatsappNumber: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <TextInput label="Website" placeholder="https://example.com" value={supplierForm.website} onChange={(e) => setSupplierForm(prev => ({ ...prev, website: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  <TextInput label="Contact Person Designation" placeholder="e.g., Sales Manager" value={supplierForm.contactPersonDesignation} onChange={(e) => setSupplierForm(prev => ({ ...prev, contactPersonDesignation: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="business" pt="md">
                <Stack gap="16px">
                  <TextInput label="Company Registration Number" placeholder="Enter registration number" value={supplierForm.companyRegistrationNumber} onChange={(e) => setSupplierForm(prev => ({ ...prev, companyRegistrationNumber: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  <Group grow>
                    <TextInput label="NTN (Tax Number)" placeholder="Enter NTN" value={supplierForm.ntn} onChange={(e) => setSupplierForm(prev => ({ ...prev, ntn: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                    <TextInput label="STRN (Sales Tax)" placeholder="Enter STRN" value={supplierForm.strn} onChange={(e) => setSupplierForm(prev => ({ ...prev, strn: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <TextInput label="License Number" placeholder="Enter license number" value={supplierForm.licenseNumber} onChange={(e) => setSupplierForm(prev => ({ ...prev, licenseNumber: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="financial" pt="md">
                <Stack gap="16px">
                  <TextInput label="Bank Name" placeholder="Enter bank name" value={supplierForm.bankName} onChange={(e) => setSupplierForm(prev => ({ ...prev, bankName: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  <Group grow>
                    <TextInput label="Bank Account Number" placeholder="Enter account number" value={supplierForm.bankAccountNumber} onChange={(e) => setSupplierForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                    <TextInput label="IBAN" placeholder="PK36SCBL0000001123456702" value={supplierForm.iban} onChange={(e) => setSupplierForm(prev => ({ ...prev, iban: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <Group grow>
                    <TextInput label="Payment Terms" placeholder="e.g., Net 30" value={supplierForm.paymentTerms} onChange={(e) => setSupplierForm(prev => ({ ...prev, paymentTerms: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                    <TextInput label="Credit Limit" placeholder="e.g., 500000" value={supplierForm.creditLimit} onChange={(e) => setSupplierForm(prev => ({ ...prev, creditLimit: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <Select label="Currency" value={supplierForm.currency} onChange={(value) => setSupplierForm(prev => ({ ...prev, currency: value || 'PKR' }))} data={[{ value: 'PKR', label: 'PKR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="supply" pt="md">
                <Stack gap="16px">
                  <Textarea label="Materials Supplied" placeholder="e.g., Lead, Acid, Plastic" rows={3} value={supplierForm.materialsSupplied} onChange={(e) => setSupplierForm(prev => ({ ...prev, materialsSupplied: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', fontFamily: 'Poppins, sans-serif' } }} />
                  <Group grow>
                    <TextInput label="MOQ" placeholder="e.g., 100 units" value={supplierForm.minimumOrderQuantity} onChange={(e) => setSupplierForm(prev => ({ ...prev, minimumOrderQuantity: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                    <TextInput label="Lead Time" placeholder="e.g., 5 days" value={supplierForm.leadTime} onChange={(e) => setSupplierForm(prev => ({ ...prev, leadTime: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <Textarea label="Delivery Areas" placeholder="e.g., Karachi, Lahore" rows={2} value={supplierForm.deliveryAreas} onChange={(e) => setSupplierForm(prev => ({ ...prev, deliveryAreas: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', fontFamily: 'Poppins, sans-serif' } }} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="logistics" pt="md">
                <Stack gap="16px">
                  <Select label="Delivery Method" placeholder="Select method" value={supplierForm.deliveryMethod} onChange={(value) => setSupplierForm(prev => ({ ...prev, deliveryMethod: value || '' }))} data={[{ value: 'Self', label: 'Self Delivery' }, { value: 'Third-party', label: 'Third-party' }, { value: 'Pickup', label: 'Pickup' }]} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  <Textarea label="Transport Charges Policy" placeholder="e.g., Free above 50,000 PKR" rows={2} value={supplierForm.transportChargesPolicy} onChange={(e) => setSupplierForm(prev => ({ ...prev, transportChargesPolicy: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', fontFamily: 'Poppins, sans-serif' } }} />
                  <TextInput label="Warehouse Location" placeholder="Enter warehouse address" value={supplierForm.warehouseLocation} onChange={(e) => setSupplierForm(prev => ({ ...prev, warehouseLocation: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="performance" pt="md">
                <Stack gap="16px">
                  <Group grow>
                    <Select label="Supplier Rating" placeholder="Select rating" value={supplierForm.supplierRating} onChange={(value) => setSupplierForm(prev => ({ ...prev, supplierRating: value || '' }))} data={[{ value: '5', label: '⭐⭐⭐⭐⭐' }, { value: '4', label: '⭐⭐⭐⭐' }, { value: '3', label: '⭐⭐⭐' }, { value: '2', label: '⭐⭐' }, { value: '1', label: '⭐' }]} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                    <Select label="Reliability" placeholder="Select score" value={supplierForm.reliabilityScore} onChange={(value) => setSupplierForm(prev => ({ ...prev, reliabilityScore: value || '' }))} data={[{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                  </Group>
                  <Textarea label="Notes / Remarks" placeholder="Internal notes" rows={4} value={supplierForm.notes} onChange={(e) => setSupplierForm(prev => ({ ...prev, notes: e.target.value }))} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', padding: '10px 12px', fontFamily: 'Poppins, sans-serif' } }} />
                  <Select label="Status" value={supplierForm.status} onChange={(value) => setSupplierForm(prev => ({ ...prev, status: value || 'Active' }))} data={[{ value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }, { value: 'Blacklisted', label: 'Blacklisted' }]} styles={{ label: { fontSize: '13px', fontWeight: '500', color: '#1a1a1a', marginBottom: '6px', fontFamily: 'Poppins, sans-serif' }, input: { border: '1px solid #e5e5e5', borderRadius: '6px', fontSize: '14px', height: '40px', fontFamily: 'Poppins, sans-serif' } }} />
                </Stack>
              </Tabs.Panel>
            </Tabs>
            </Box>
          </Box>

          {/* Footer */}
          <Box style={{ 
            padding: 'clamp(16px, 3vw, 24px) clamp(16px, 4vw, 32px)',
            backgroundColor: '#fff',
            borderTop: '1px solid #e5e5e5'
          }}>
            <Group style={{ 
              justifyContent: 'flex-end', 
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <Button
                onClick={() => {
                  setShowSupplierForm(false);
                  setEditingSupplier(null);
                  resetSupplierForm();
                }}
                style={{ 
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '1px solid #d0d0d0',
                  borderRadius: '8px',
                  fontSize: 'clamp(13px, 2vw, 14px)',
                  fontWeight: '500',
                  padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 28px)',
                  fontFamily: 'Poppins, sans-serif',
                  height: 'clamp(40px, 6vw, 44px)',
                  minWidth: '120px'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSupplier}
                disabled={!supplierForm.name || !supplierForm.email || !supplierForm.phone || isSubmittingSupplier}
                style={{ 
                  backgroundColor: !supplierForm.name || !supplierForm.email || !supplierForm.phone || isSubmittingSupplier ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 'clamp(13px, 2vw, 14px)',
                  fontWeight: '500',
                  padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 28px)',
                  fontFamily: 'Poppins, sans-serif',
                  cursor: !supplierForm.name || !supplierForm.email || !supplierForm.phone || isSubmittingSupplier ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: 'clamp(40px, 6vw, 44px)',
                  minWidth: '140px',
                  justifyContent: 'center'
                }}
              >
                {isSubmittingSupplier && (
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                )}
                {isSubmittingSupplier 
                  ? (editingSupplier ? 'Updating...' : 'Adding...') 
                  : (editingSupplier ? 'Update' : 'Add') + ' Supplier'
                }
              </Button>
            </Group>
          </Box>
        </Box>

        {/* Responsive Styles */}
        <style>{`
          /* Mobile styles */
          @media (max-width: 768px) {
            .mantine-Drawer-content {
              width: 100vw !important;
            }
            
            .mantine-Tabs-list {
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
            }
            
            .mantine-Tabs-list::-webkit-scrollbar {
              display: none;
            }
            
            .mantine-Group-root[style*="grow"] > * {
              flex: 1 1 100% !important;
              min-width: 100% !important;
            }
          }
          
          /* Small mobile */
          @media (max-width: 480px) {
            .mantine-Drawer-body {
              padding: 0 !important;
            }
            
            .mantine-Group-root {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            
            .mantine-Group-root > * {
              width: 100% !important;
              max-width: 100% !important;
            }
            
            .mantine-Button-root {
              width: 100% !important;
            }
          }
        `}</style>
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

      {/* PDF Options Modal */}
      <Modal
        opened={showPdfOptionsModal}
        onClose={() => {
          setShowPdfOptionsModal(false);
          setPendingPdfOrder(null);
        }}
        title="Download PDF"
        size="md"
        centered
        styles={{
          title: {
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif',
            color: '#1a1a1a'
          },
          header: {
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0'
          },
          body: {
            padding: '24px'
          }
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <Text style={{ 
            fontSize: '14px', 
            color: '#666', 
            fontFamily: 'Poppins, sans-serif',
            lineHeight: '1.6'
          }}>
            Do you want to include supplier information in the PDF?
          </Text>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              if (pendingPdfOrder) {
                downloadBOMPDF(pendingPdfOrder, false);
              }
              setShowPdfOptionsModal(false);
              setPendingPdfOrder(null);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#666',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            No, Without Suppliers
          </button>
          <button
            onClick={() => {
              if (pendingPdfOrder) {
                downloadBOMPDF(pendingPdfOrder, true);
              }
              setShowPdfOptionsModal(false);
              setPendingPdfOrder(null);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Poppins, sans-serif',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
            }}
          >
            Yes, Include Suppliers
          </button>
        </div>
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
        styles={{
          title: {
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif'
          },
          header: {
            padding: '20px 24px',
            borderBottom: '1px solid #f0f0f0'
          },
          body: {
            padding: '24px',
            maxHeight: '70vh',
            overflowY: 'auto'
          }
        }}
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

      {/* Success Notification */}
      {showSuccessNotification && (
        <Box
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#fff',
            border: '1px solid #e5e5e5',
            borderLeft: '4px solid #28a745',
            borderRadius: '8px',
            padding: '16px 20px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 10000,
            minWidth: '300px',
            animation: 'slideIn 0.3s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: '#28a745',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
          </div>
          <div style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a1a1a',
                fontFamily: 'Poppins, sans-serif',
                marginBottom: '2px'
              }}
            >
              Success
            </Text>
            <Text
              style={{
                fontSize: '13px',
                color: '#666',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              {successMessage}
            </Text>
          </div>
          <button
            onClick={() => setShowSuccessNotification(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            ×
          </button>
        </Box>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
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
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [financeSuccess, setFinanceSuccess] = useState(false);

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

      // Open WhatsApp for each selected supplier
      selectedSupplierIds.forEach((supplierId, index) => {
        const supplier = suppliers.find((s: any) => s.id === supplierId);
        const phone = (supplier.phone || '').replace(/[^0-9]/g, '') || '923001234567';
        const itemsList = bom.items?.map((item: any) =>
          `• ${item.itemName}: ${item.quantity} ${item.unit || 'pcs'}`
        ).join('\n') || '';
        const message = `*BOM Request*\n\nDear ${supplier.name},\n\nPlease provide a quote for the following BOM:\n\n*BOM #:* ${bom.poNumber || bom.po_number}\n\n*Items:*\n${itemsList}\n\nKindly send your best rates at your earliest convenience.\n\nThank you!`;
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        // Stagger opening tabs slightly to avoid popup blockers
        setTimeout(() => window.open(url, '_blank'), index * 500);
      });

      setSentSupplierIds(prev => [...prev, ...selectedSupplierIds]);
      setSelectedSupplierIds([]);
      setShowSendToSupplier(false);
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
        setShowAddQuote(false);
        setQuoteSuccess(true);
        setTimeout(() => setQuoteSuccess(false), 3000);
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
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Section - Compact */}
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        padding: "16px",
        backgroundColor: "#fafafa",
        borderRadius: "6px",
        border: "1px solid #f0f0f0"
      }}>
        <div>
          <Text style={{ fontSize: "10px", color: "#999", fontFamily: "Poppins, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
            BOM Number
          </Text>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#1a1a1a", fontFamily: "Poppins, sans-serif" }}>
            {bom.poNumber}
          </Text>
        </div>
        <div>
          <Text style={{ fontSize: "10px", color: "#999", fontFamily: "Poppins, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
            Created By
          </Text>
          <Text style={{ fontSize: "13px", fontWeight: "500", color: "#333", fontFamily: "Poppins, sans-serif" }}>
            {bom.createdBy}
          </Text>
        </div>
        <div>
          <Text style={{ fontSize: "10px", color: "#999", fontFamily: "Poppins, sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
            Total Amount
          </Text>
          <Text style={{ fontSize: "14px", fontWeight: "600", color: "#16a34a", fontFamily: "Poppins, sans-serif" }}>
            PKR {bom.totalAmount?.toFixed(2) || '0.00'}
          </Text>
        </div>
      </div>

      {/* Items Section - Compact Table */}
      <div>
        <Text style={{ 
          fontSize: "13px", 
          fontWeight: "600", 
          marginBottom: "12px", 
          color: "#1a1a1a",
          fontFamily: "Poppins, sans-serif"
        }}>
          Items ({bom.items?.length || 0})
        </Text>
        
        {bom.items && bom.items.length > 0 ? (
          <div style={{ backgroundColor: "white", border: "1px solid #e5e5e5", borderRadius: "6px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Item</th>
                  <th style={{ padding: "10px 12px", textAlign: "center", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Qty</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Unit Price</th>
                  <th style={{ padding: "10px 12px", textAlign: "right", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {bom.items.map((item: any, index: number) => (
                  <tr key={item.id} style={{ borderBottom: index < bom.items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <td style={{ padding: "12px", fontSize: "13px", fontWeight: "500", color: "#1a1a1a", fontFamily: "Poppins, sans-serif" }}>
                      {item.itemName}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", fontWeight: "500", color: "#1a1a1a", textAlign: "center", fontFamily: "Poppins, sans-serif" }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "#666", textAlign: "right", fontFamily: "Poppins, sans-serif" }}>
                      PKR 0.00
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "#666", textAlign: "right", fontFamily: "Poppins, sans-serif" }}>
                      PKR 0.00
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Text style={{ color: "#999", fontSize: "13px", textAlign: "center", padding: "20px", fontFamily: "Poppins, sans-serif" }}>No items in this BOM.</Text>
        )}
      </div>

      {/* Suppliers Section */}
      {bom.suppliers && bom.suppliers.length > 0 && (
        <div>
          <Text style={{ 
            fontSize: "13px", 
            fontWeight: "600", 
            marginBottom: "12px", 
            color: "#1a1a1a",
            fontFamily: "Poppins, sans-serif"
          }}>
            Suppliers
          </Text>
          <div style={{ backgroundColor: "white", border: "1px solid #e5e5e5", borderRadius: "6px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Name</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Email</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Phone</th>
                  <th style={{ padding: "10px 12px", textAlign: "left", fontSize: "10px", fontWeight: "600", color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "Poppins, sans-serif" }}>Address</th>
                </tr>
              </thead>
              <tbody>
                {bom.suppliers.map((supplier: any, index: number) => (
                  <tr key={supplier.id} style={{ borderBottom: index < bom.suppliers.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                    <td style={{ padding: "12px", fontSize: "13px", fontWeight: "500", color: "#1a1a1a", fontFamily: "Poppins, sans-serif" }}>
                      {supplier.name}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                      {supplier.email || '—'}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                      {supplier.phone || '—'}
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                      {supplier.address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Remarks Section */}
      {bom.status === 'pending_approval' && (
        <div>
          <Text style={{ 
            fontSize: "13px", 
            fontWeight: "600", 
            marginBottom: "12px", 
            color: "#1a1a1a",
            fontFamily: "Poppins, sans-serif"
          }}>
            Rejection Remarks (if rejecting)
          </Text>
          <textarea
            placeholder="Enter rejection remarks here..."
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "13px",
              border: "1px solid #e0e0e0",
              borderRadius: "6px",
              fontFamily: "Poppins, sans-serif",
              minHeight: "80px",
              resize: "vertical",
              outline: "none"
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#007bff"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#e0e0e0"}
          />
        </div>
      )}

      {/* Existing Quotes Section */}
      {bomQuotes.length > 0 && (
        <div>
          <Text style={{ fontSize: "13px", fontWeight: "600", marginBottom: "12px", color: "#1a1a1a", fontFamily: "Poppins, sans-serif" }}>
            Quotes Received ({bomQuotes.length})
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {bomQuotes.map((q: any, i: number) => (
              <div key={i} style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "12px", backgroundColor: bestQuote === q ? "#f0fdf4" : "white", borderColor: bestQuote === q ? "#d1fae5" : "#e5e5e5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Text style={{ fontWeight: "600", fontSize: "13px", fontFamily: "Poppins, sans-serif", color: "#1a1a1a" }}>{q.supplierName}</Text>
                    {bestQuote === q && <Badge color="green" size="xs" variant="outline">Best</Badge>}
                  </div>
                  <Text style={{ fontWeight: "700", fontSize: "13px", color: "#16a34a", fontFamily: "Poppins, sans-serif" }}>PKR {q.totalAmount?.toLocaleString()}</Text>
                </div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {Object.entries(q.itemRates || {}).map(([itemName, rate]: [string, any]) => (
                    <Text key={itemName} style={{ fontSize: "11px", color: "#666", fontFamily: "Poppins, sans-serif" }}>
                      {itemName}: PKR {rate.unitPrice}/unit
                    </Text>
                  ))}
                  {q.transportCost > 0 && <Text style={{ fontSize: "11px", color: "#666", fontFamily: "Poppins, sans-serif" }}>Transport: PKR {q.transportCost}</Text>}
                  {q.tax > 0 && <Text style={{ fontSize: "11px", color: "#666", fontFamily: "Poppins, sans-serif" }}>Tax: PKR {q.tax}</Text>}
                </div>
                {q.notes && <Text style={{ fontSize: "11px", color: "#888", marginTop: "4px", fontStyle: "italic", fontFamily: "Poppins, sans-serif" }}>{q.notes}</Text>}
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
                    setIsSentToFinance(true);
                    onSentToFinance?.();
                    setFinanceSuccess(true);
                    setTimeout(() => setFinanceSuccess(false), 3000);
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

      {/* Quote Success Toast */}
      {quoteSuccess && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#111", color: "white", padding: "14px 24px", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontFamily: "Poppins, sans-serif", fontSize: "14px", fontWeight: "500", minWidth: "260px", justifyContent: "center" }}>
          <span style={{ fontSize: "18px" }}>✓</span>
          Quote added successfully!
        </div>
      )}

      {/* Finance Success Toast */}
      {financeSuccess && (
        <div style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 9999, display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#111", color: "white", padding: "14px 24px", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", fontFamily: "Poppins, sans-serif", fontSize: "14px", fontWeight: "500", minWidth: "280px", justifyContent: "center" }}>
          <span style={{ fontSize: "18px" }}>✓</span>
          BOM sent to Finance successfully!
        </div>
      )}

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


