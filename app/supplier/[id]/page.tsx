"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BOMRatesForm } from "@/components/BOMRatesForm";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface BOMSend {
  id: string;
  bomId: string;
  bomNumber: string;
  supplierId: string;
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

export default function SupplierProfilePage() {
  const params = useParams();
  const supplierId = params.id as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [boms, setBoms] = useState<BOMSend[]>([]);
  const [selectedBom, setSelectedBom] = useState<BOMSend | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [supplierRes, bomsRes] = await Promise.all([
          fetch(`/api/suppliers/${supplierId}`),
          fetch(`/api/supplier/boms?supplierId=${supplierId}`),
        ]);

        if (supplierRes.ok) {
          setSupplier(await supplierRes.json());
        }

        if (bomsRes.ok) {
          const allBoms = await bomsRes.json();
          // Filter BOMs for this specific supplier
          const supplierBoms = allBoms.filter(
            (bom: BOMSend) => bom.supplierId === supplierId
          );
          setBoms(supplierBoms);
          if (supplierBoms.length > 0) {
            setSelectedBom(supplierBoms[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId]);

  const handleSaveRates = async (rates: { [key: string]: number }) => {
    if (!selectedBom) return;

    try {
      const response = await fetch("/api/bom/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bomId: selectedBom.bomId,
          supplierId: supplierId,
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
          <p className="text-gray-600">Loading supplier profile...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">Supplier not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Supplier Header */}
      <div className="bg-white rounded-lg shadow mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {supplier.name}
            </h1>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Email:</span> {supplier.email}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Phone:</span> {supplier.phone}
              </p>
              {supplier.address && (
                <p className="text-gray-600">
                  <span className="font-medium">Address:</span>{" "}
                  {supplier.address}
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">
              BOMs Sent
            </p>
            <p className="text-4xl font-bold text-blue-600">{boms.length}</p>
            <p className="text-sm text-gray-600 mt-2">
              Total BOMs for this supplier
            </p>
          </div>
        </div>
      </div>

      {boms.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No BOMs sent to this supplier yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* BOM List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">BOMs</h2>
              </div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {boms.map((bom) => (
                  <button
                    key={bom.id}
                    onClick={() => setSelectedBom(bom)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                      selectedBom?.id === bom.id
                        ? "bg-blue-50 border-l-4 border-blue-600"
                        : ""
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">
                      {bom.bomNumber}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {bom.items.length} items
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(bom.sentAt).toLocaleDateString()}
                    </p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {bom.status}
                    </span>
                  </button>
                ))}
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

                <div className="mb-6 pb-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedBom.bomNumber}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Sent: {new Date(selectedBom.sentAt).toLocaleDateString()}
                  </p>
                </div>

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
      )}
    </div>
  );
}
