"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BOMSend {
  id: string;
  bomNumber: string;
  supplierName: string;
  status: string;
  sentAt: string;
  items: Array<{
    id: string;
    itemName: string;
    quantity: number;
    unit: string;
  }>;
}

interface Quote {
  id: string;
  bomNumber: string;
  items: Array<{
    totalPrice: number;
  }>;
  submittedAt: string;
  status: string;
}

export default function SupplierDashboard() {
  const [boms, setBoms] = useState<BOMSend[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bomsRes, quotesRes] = await Promise.all([
          fetch("/api/supplier/boms"),
          fetch("/api/supplier/quotes"),
        ]);

        if (bomsRes.ok) setBoms(await bomsRes.json());
        if (quotesRes.ok) setQuotes(await quotesRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalQuoteValue = quotes.reduce(
    (sum, q) => sum + q.items.reduce((s, item) => s + item.totalPrice, 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your supplier portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">BOMs Received</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{boms.length}</p>
          <p className="text-xs text-gray-500 mt-2">
            {boms.filter((b) => b.status === "sent").length} pending
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Quotes Submitted</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{quotes.length}</p>
          <p className="text-xs text-gray-500 mt-2">
            {quotes.filter((q) => q.status === "submitted").length} submitted
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Total Quote Value</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {totalQuoteValue.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Across all quotes</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm font-medium">Response Rate</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {boms.length > 0
              ? Math.round((quotes.length / boms.length) * 100)
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500 mt-2">Quotes vs BOMs</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent BOMs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent BOMs</h2>
          </div>
          <div className="divide-y">
            {boms.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No BOMs received yet
              </div>
            ) : (
              boms.slice(0, 5).map((bom) => (
                <div key={bom.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{bom.bomNumber}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {bom.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {bom.items.length} items
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(bom.sentAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <Link
              href="/supplier"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all BOMs →
            </Link>
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Quotes</h2>
          </div>
          <div className="divide-y">
            {quotes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No quotes submitted yet
              </div>
            ) : (
              quotes.slice(0, 5).map((quote) => (
                <div key={quote.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">
                      {quote.bomNumber}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        quote.status === "submitted"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {quote.items.length} items
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(quote.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <Link
              href="/supplier/quotes"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all quotes →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/supplier"
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition text-center"
          >
            <p className="font-medium text-gray-900">Submit New Quote</p>
            <p className="text-sm text-gray-600 mt-1">
              Respond to pending BOMs
            </p>
          </Link>
          <Link
            href="/supplier/quotes"
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-600 hover:shadow-md transition text-center"
          >
            <p className="font-medium text-gray-900">View My Quotes</p>
            <p className="text-sm text-gray-600 mt-1">
              Check submitted quotations
            </p>
          </Link>
          <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
            <p className="font-medium text-gray-900">Need Help?</p>
            <p className="text-sm text-gray-600 mt-1">
              Contact support team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
