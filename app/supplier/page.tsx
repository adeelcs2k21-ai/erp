"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface BOMSend {
  id: string;
  bomNumber: string;
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

export default function SupplierPortal() {
  const router = useRouter();
  const [bomSends, setBomSends] = useState<BOMSend[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedBom, setSelectedBom] = useState<BOMSend | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bomsRes = await fetch("/api/supplier/boms");
        const quotesRes = await fetch("/api/supplier/quotes");

        if (bomsRes.ok && quotesRes.ok) {
          setBomSends(await bomsRes.json());
          setQuotes(await quotesRes.json());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Supplier Portal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* BOMs Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">BOMs Sent to You</h2>
          <div className="space-y-4">
            {bomSends.length === 0 ? (
              <p className="text-gray-500">No BOMs sent yet</p>
            ) : (
              bomSends.map((bom) => (
                <div
                  key={bom.id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{bom.bomNumber}</h3>
                      <p className="text-sm text-gray-600">
                        Sent: {new Date(bom.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {bom.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Items:</p>
                    <div className="space-y-2">
                      {bom.items.map((item) => (
                        <div
                          key={item.id}
                          className="text-sm bg-gray-50 p-2 rounded"
                        >
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-gray-600">
                            {item.quantity} {item.unit} - {item.itemType}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedBom(bom);
                      setShowQuoteForm(true);
                    }}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                  >
                    Submit Quote
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quotes Section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Your Quotes</h2>
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <p className="text-gray-500">No quotes submitted yet</p>
            ) : (
              quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <p className="font-medium text-sm">{quote.bomNumber}</p>
                  <p className="text-xs text-gray-600 mb-2">
                    {new Date(quote.submittedAt).toLocaleDateString()}
                  </p>
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
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quote Form Modal */}
      {showQuoteForm && selectedBom && (
        <QuoteForm
          bom={selectedBom}
          onClose={() => {
            setShowQuoteForm(false);
            setSelectedBom(null);
          }}
          onSubmit={() => {
            setShowQuoteForm(false);
            setSelectedBom(null);
            // Refresh quotes
            fetch("/api/supplier/quotes")
              .then((res) => res.json())
              .then(setQuotes);
          }}
        />
      )}
    </div>
  );
}

function QuoteForm({
  bom,
  onClose,
  onSubmit,
}: {
  bom: BOMSend;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [formData, setFormData] = useState<{
    [key: string]: number;
  }>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePriceChange = (itemId: string, price: number) => {
    setFormData((prev) => ({
      ...prev,
      [itemId]: price,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/supplier/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bomSendId: bom.id,
          bomNumber: bom.bomNumber,
          items: bom.items.map((item) => ({
            itemId: item.id,
            itemName: item.itemName,
            quotedPrice: formData[item.id] || 0,
            quantity: item.quantity,
            totalPrice: (formData[item.id] || 0) * item.quantity,
          })),
          notes,
        }),
      });

      if (response.ok) {
        onSubmit();
      }
    } catch (error) {
      console.error("Error submitting quote:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const totalQuoteValue = bom.items.reduce(
    (sum, item) => sum + (formData[item.id] || 0) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Submit Quote for {bom.bomNumber}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="space-y-4">
              {bom.items.map((item) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Price per unit
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData[item.id] || ""}
                        onChange={(e) =>
                          handlePriceChange(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-full border rounded px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Total: {((formData[item.id] || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder="Add any notes about your quote..."
            />
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <p className="text-lg font-semibold">
              Total Quote Value: {totalQuoteValue.toFixed(2)}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
