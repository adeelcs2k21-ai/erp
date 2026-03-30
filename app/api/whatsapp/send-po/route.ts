import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { suppliers, poNumber, items, deliveryDate, paymentTerms, totalAmount } = body;

  try {
    // Format PO details for WhatsApp message
    const itemsList = items
      .map((item: any) => `• ${item.itemName} - Qty: ${item.quantity} ${item.unit} @ PKR ${item.unitPrice}`)
      .join("\n");

    const message = `
*Purchase Order: ${poNumber}*

*Items:*
${itemsList}

*Delivery Date:* ${deliveryDate}
*Payment Terms:* ${paymentTerms}
*Total Amount:* PKR ${totalAmount.toFixed(2)}

Please confirm receipt of this PO.
    `.trim();

    // Send to each supplier via WhatsApp
    for (const supplier of suppliers) {
      if (supplier.phone) {
        // Format phone number for WhatsApp (remove special characters, ensure country code)
        const phoneNumber = supplier.phone.replace(/\D/g, "");
        const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        // In a real implementation, you would use WhatsApp Business API
        // For now, we'll just log the link and return it
        console.log(`WhatsApp link for ${supplier.name}: ${whatsappLink}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "PO details prepared for WhatsApp sending",
      suppliers: suppliers.map((s: any) => ({
        name: s.name,
        phone: s.phone,
        whatsappLink: `https://wa.me/${s.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
      })),
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
