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

export function QuotesDisplay() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

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

  if (loading) {
    return <div className="p-4">Loading quotes...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Supplier Quotes</h2>

      {quotes.length === 0 ? (
        <p className="text-gray-500">No quotes submitted yet</p>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedQuote(quote)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{quote.bomNumber}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(quote.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
                  {quote.status}
                </span>
              </div>

              <div className="text-sm">
                <p className="text-gray-600">
                  {quote.items.length} items - Total:{" "}
                  <span className="font-semibold">
                    {quote.items
                      .reduce((sum, item) => sum + item.totalPrice, 0)
                      .toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedQuote && (
        <QuoteDetail
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </div>
  );
}

function QuoteDetail({
  quote,
  onClose,
}: {
  quote: Quote;
  onClose: () => void;
}) {
  const totalValue = quote.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{quote.bomNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Submitted: {new Date(quote.submittedAt).toLocaleString()}
            </p>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm">
              {quote.status}
            </span>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="space-y-3">
              {quote.items.map((item) => (
                <div key={item.itemId} className="border rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <p className="font-medium">{item.itemName}</p>
                    <p className="font-semibold">{item.totalPrice.toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.quantity} units @ {item.quotedPrice.toFixed(2)} each
                  </p>
                </div>
              ))}
            </div>
          </div>

          {quote.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">
                {quote.notes}
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-lg font-semibold">
              Total Quote Value: {totalValue.toFixed(2)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full border rounded py-2 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
