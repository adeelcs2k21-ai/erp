"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  }>;
}

export default function SupplierListPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allBoms, setAllBoms] = useState<BOMSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);

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

  const handleViewBoms = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowDrawer(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suppliers</h1>
        <p className="text-gray-600">
          Manage supplier profiles and their BOMs
        </p>
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No suppliers found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {suppliers.map((supplier) => {
                  const supplierBoms = getSupplierBoms(supplier.id);
                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {supplier.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {supplier.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {supplier.phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {supplier.address || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewBoms(supplier)}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                          >
                            BOM ({supplierBoms.length})
                          </button>
                          <Link
                            href={`/supplier/${supplier.id}`}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 font-medium text-sm"
                          >
                            View Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOM Drawer */}
      {showDrawer && selectedSupplier && (
        <BOMDrawer
          supplier={selectedSupplier}
          boms={getSupplierBoms(selectedSupplier.id)}
          onClose={() => {
            setShowDrawer(false);
            setSelectedSupplier(null);
          }}
        />
      )}
    </div>
  );
}

function BOMDrawer({
  supplier,
  boms,
  onClose,
}: {
  supplier: Supplier;
  boms: BOMSend[];
  onClose: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{supplier.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{supplier.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {boms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No BOMs sent to this supplier yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                BOMs Received ({boms.length})
              </p>
              {boms.map((bom) => (
                <div
                  key={bom.id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {bom.bomNumber}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(bom.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {bom.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Items ({bom.items.length}):
                    </p>
                    <div className="space-y-1">
                      {bom.items.map((item) => (
                        <div key={item.id} className="text-xs text-gray-600">
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-gray-500">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
