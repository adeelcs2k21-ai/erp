"use client";

import { useEffect, useState } from "react";
import { BOMRatesForm } from "@/components/BOMRatesForm";

interface BOMSend {
  id: string;
  bomId: string;
  bomNumber: string;
  supplierId: string;
  supplierName: string;
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

export default function BOMRatesPage() {
  const [boms, setBoms] = useState<BOMSend[]>([]);
  const [selectedBom, setSelectedBom] = useState<BOMSend | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Set BOM Rates</h1>
        <p className="text-gray-600">
          Configure unit rates for items in each BOM
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* BOM List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-gray-900">BOMs</h2>
            </div>
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {boms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No BOMs available
                </div>
              ) : (
                boms.map((bom) => (
                  <button
                    key={bom.id}
                    onClick={() => setSelectedBom(bom)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedBom?.id === bom.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rates Form */}
        <div className="lg:col-span-3">
          {selectedBom ? (
            <div className="bg-white rounded-lg shadow p-6">
              {saveMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
                  {saveMessage}
                </div>
              )}
              <BOMRatesForm
                bomId={selectedBom.bomId}
                bomNumber={selectedBom.bomNumber}
                items={selectedBom.items}
                onSave={handleSaveRates}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a BOM to set rates
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
