"use client";

import { useEffect, useState } from "react";

interface Quote {
  id: string;
  bomSendId: string;
  bomNumber: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quotedPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
  notes: string;
  submittedAt: string;
  status: "draft" | "submitted";
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "submitted" | "draft">("all");

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch("/api/supplier/quotes");
        if (res.ok) {
          setQuotes(await res.json());
        }
      } catch (error) {
        console.error("Error fetching quotes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  const filteredQuotes = quotes.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Quotes</h1>
        <p className="text-gray-600">
          Review and manage quotations submitted by suppliers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats */}
        <div className="lg:col-span-4 grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Total Quotes</p>
            <p className="text-3xl font-bold text-gray-900">{quotes.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Submitted</p>
            <p className="text-3xl font-bold text-green-600">
              {quotes.filter((q) => q.status === "submitted").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Draft</p>
            <p className="text-3xl font-bold text-yellow-600">
              {quotes.filter((q) => q.status === "draft").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="lg:col-span-4 mb-6">
          <div className="flex gap-2">
            {(["all", "submitted", "draft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Quotes List */}
        <div className="lg:col-span-3">
          <div className="space-y-4">
            {filteredQuotes.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">No quotes found</p>
              </div>
            ) : (
              filteredQuotes.map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {quote.bomNumber}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(quote.submittedAt).toLocaleDateString()} at{" "}
                        {new Date(quote.submittedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        quote.status === "submitted"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Items</p>
                      <p className="font-semibold text-gray-900">
                        {quote.items.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Value</p>
                      <p className="font-semibold text-gray-900">
                        {quote.items
                          .reduce((sum, item) => sum + item.totalPrice, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Unit Price</p>
                      <p className="font-semibold text-gray-900">
                        {(
                          quote.items.reduce((sum, item) => sum + item.quotedPrice, 0) /
                          quote.items.length
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quote Detail */}
        <div className="lg:col-span-1">
          {selectedQuote ? (
            <div className="bg-white rounded-lg shadow sticky top-6">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">Quote Details</h2>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    BOM Number
                  </p>
                  <p className="font-semibold text-gray-900">
                    {selectedQuote.bomNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Status
                  </p>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      selectedQuote.status === "submitted"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedQuote.status}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Submitted
                  </p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedQuote.submittedAt).toLocaleString()}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">
                    Items ({selectedQuote.items.length})
                  </p>
                  <div className="space-y-2">
                    {selectedQuote.items.map((item) => (
                      <div key={item.itemId} className="text-sm">
                        <p className="font-medium text-gray-900">
                          {item.itemName}
                        </p>
                        <p className="text-gray-600">
                          {item.quantity} × {item.quotedPrice.toFixed(2)}
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-600 uppercase tracking-wide">
                    Total Quote Value
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedQuote.items
                      .reduce((sum, item) => sum + item.totalPrice, 0)
                      .toFixed(2)}
                  </p>
                </div>

                {selectedQuote.notes && (
                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {selectedQuote.notes}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setSelectedQuote(null)}
                  className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              Select a quote to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
