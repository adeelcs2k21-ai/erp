"use client";
import React from "react";
import BOMReview from "../../../components/BOMReview";

const items = [
  { name: "Lead Plates (Positive & Negative)", qty: 120, unitPrice: 0, total: 0 },
  { name: "Sulfuric Acid (H₂SO₄)", qty: 50, unitPrice: 0, total: 0 },
];

const suppliers = [
  {
    name: "Pak Battery Materials",
    email: "sales@pakbattery.com",
    phone: "+92 321 5566778",
    address: "Sector B-17, Islamabad, Pakistan",
  },
];

export default function Page() {
  return (
    <main className="p-6">
      <BOMReview
        bomNumber="BOM-1774955406701"
        createdBy="superadmin"
        totalAmount="PKR 1700.00"
        items={items}
        suppliers={suppliers}
      />
    </main>
  );
}
