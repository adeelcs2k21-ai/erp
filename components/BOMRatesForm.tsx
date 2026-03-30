"use client";

import { useState } from "react";

interface BOMItem {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  description: string;
}

interface BOMRatesFormProps {
  bomId: string;
  bomNumber: string;
  items: BOMItem[];
  onSave: (rates: { [key: string]: number }) => Promise<void>;
}

export function BOMRatesForm({
  bomId,
  bomNumber,
  items,
  onSave,
}: BOMRatesFormProps) {
  const [rates, setRates] = useState<{ [key: string]: number }>(
    items.reduce((acc, item) => ({ ...acc, [item.id]: item.unitPrice }), {})
  );
  const [saving, setSaving] = useState(false);

  const handleRateChange = (itemId: string, rate: number) => {
    setRates((prev) => ({
      ...prev,
      [itemId]: rate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(rates);
    } finally {
      setSaving(false);
    }
  };

  const totalValue = items.reduce(
    (sum, item) => sum + (rates[item.id] || 0) * item.quantity,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Set Rates for {bomNumber}
        </h3>

        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-gray-600">{item.itemType}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="font-medium">
                    {item.quantity} {item.unit}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Unit Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={rates[item.id] || ""}
                    onChange={(e) =>
                      handleRateChange(item.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-semibold">
                    {((rates[item.id] || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 mt-2">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded border">
        <p className="text-lg font-semibold">
          Total BOM Value: {totalValue.toFixed(2)}
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Rates"}
      </button>
    </form>
  );
}
