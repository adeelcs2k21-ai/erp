"use client";

import { useEffect, useState } from "react";
import { BOMRatesForm } from "@/components/BOMRatesForm";

interface BOMSend {
  id: string;
  bomId: string;
  bomNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone: string;
  status: string;
  sentAt: string;
  items: Array<{
    id: string;
    itemName: string;
    itemType: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    description: string;
  }>;
}

type TabType = "boms" | "rates";

export default function BOMManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("boms");
  const [boms, setBoms] = useState<BOMSend[]>([]);
  const [selectedBom, setSelectedBom] = useState<BOMSend | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchBoms = async () => {
      try {
        const res = await fetch("/api/supplier/boms");
        if (res.ok) {
          const data = await res.json();
          setBoms(data);
          if (data.length > 0) {
            setSelectedBom(data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching BOMs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoms();
  }, []);

  const handleSaveRates = async (rates: { [key: string]: number }) => {
    if (!selectedBom) return;

    try {
      const response = await fetch("/api/bom/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bomId: selectedBom.bomId,
          supplierId: selectedBom.supplierId,
          rates,
        }),
      });

      if (response.ok) {
        setSaveMessage("Rates saved successfully!");
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error saving rates:", error);
      setSaveMessage("Error saving rates");
    }
  };

  const filteredBoms = boms.filter(
    (bom) =>
      bom.bomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading BOMs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">BOM Management</h1>
        <p className="text-gray-600">Manage BOMs and set supplier rates</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("boms")}
            className={`flex-1 px-6 py-4 font-medium text-center transition ${
              activeTab === "boms"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            BOMs
          </button>
          <button
            onClick={() => setActiveTab("rates")}
            className={`flex-1 px-6 py-4 font-medium text-center transition ${
              activeTab === "rates"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Set Rates
          </button>
        </div>

        {/* BOMs Tab */}
        {activeTab === "boms" && (
          <div className="p-6">
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by BOM number or supplier name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {filteredBoms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No BOMs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        BOM Number
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Supplier
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Sent Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredBoms.map((bom) => (
                      <tr
                        key={bom.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {bom.bomNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {bom.supplierName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {bom.supplierPhone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {bom.items.length} items
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {bom.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(bom.sentAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setSelectedBom(bom);
                              setActiveTab("rates");
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Set Rates
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Set Rates Tab */}
        {activeTab === "rates" && (
          <div className="p-6">
            {selectedBom ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* BOM List */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg border">
                    <div className="p-4 border-b font-semibold text-gray-900">
                      BOMs
                    </div>
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {filteredBoms.map((bom) => (
                        <button
                          key={bom.id}
                          onClick={() => setSelectedBom(bom)}
                          className={`w-full text-left p-4 hover:bg-white transition ${
                            selectedBom?.id === bom.id
                              ? "bg-white border-l-4 border-blue-600"
                              : ""
                          }`}
                        >
                          <p className="font-medium text-sm text-gray-900">
                            {bom.bomNumber}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {bom.supplierName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {bom.items.length} items
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rates Form */}
                <div className="lg:col-span-3">
                  {saveMessage && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
                      {saveMessage}
                    </div>
                  )}

                  <div className="mb-6 pb-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedBom.bomNumber}
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          Supplier
                        </p>
                        <p className="font-semibold text-gray-900">
                          {selectedBom.supplierName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide">
                          Sent Date
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Date(selectedBom.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <BOMRatesForm
                    bomId={selectedBom.bomId}
                    bomNumber={selectedBom.bomNumber}
                    items={selectedBom.items}
                    onSave={handleSaveRates}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No BOM selected</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total BOMs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{boms.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Unique Suppliers</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {new Set(boms.map((b) => b.supplierId)).size}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Items</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {boms.reduce((sum, b) => sum + b.items.length, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
