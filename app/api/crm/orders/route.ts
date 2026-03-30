import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get("clientId");
  let query = supabaseAdmin.from("crm_orders").select("*").order("created_at", { ascending: false });
  if (clientId) query = query.eq("client_id", clientId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("crm_orders").insert({
    id: Date.now().toString(),
    client_id: body.clientId,
    client_name: body.clientName,
    product_name: body.productName,
    quantity: body.quantity || 1,
    unit: body.unit || "pieces",
    unit_price: body.unitPrice || 0,
    total_price: (body.quantity || 1) * (body.unitPrice || 0),
    status: "pending",
    notes: body.notes || "",
    created_by: body.createdBy || "unknown",
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify superadmin
  await supabaseAdmin.from("notifications").insert({
    id: Date.now().toString() + "n",
    user_id: "superadmin",
    type: "crm_order",
    title: "New Client Order",
    message: `${body.clientName} ordered ${body.quantity} ${body.unit} of "${body.productName}"`,
    po_id: data.id,
    read: false,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const updates: any = { status: body.status };

  if (body.status === "sent_to_finance") {
    updates.po_number = `PO-CRM-${Date.now()}`;
    updates.unit_price = body.unitPrice || 0;
    updates.total_price = body.totalPrice || 0;
    
    // Add tax, transport, and other charges if provided
    if (body.tax !== undefined) updates.tax = body.tax;
    if (body.transport !== undefined) updates.transport = body.transport;
    if (body.otherCharges !== undefined) updates.other_charges = body.otherCharges;
    if (body.otherChargesNotes !== undefined) updates.other_charges_notes = body.otherChargesNotes;
  }
  if (body.status === "po_sent") {
    updates.po_sent_at = new Date().toISOString();
  }
  if (body.status === "payment_confirmed") {
    updates.payment_amount = body.paymentAmount;
    updates.payment_method = body.paymentMethod;
    updates.payment_screenshot = body.paymentScreenshot;
    updates.payment_notes = body.paymentNotes;
    updates.payment_confirmed_at = new Date().toISOString();
    updates.payment_confirmed_by = body.confirmedBy;
    
    // Notify inventory about the confirmed payment
    const { data: orderData } = await supabaseAdmin.from("crm_orders").select("*").eq("id", body.id).single();
    if (orderData) {
      await supabaseAdmin.from("notifications").insert({
        id: Date.now().toString() + "n",
        user_id: "inventory",
        type: "payment_confirmed",
        title: "Payment Confirmed - Client Order",
        message: `Payment confirmed for ${orderData.client_name}'s order of ${orderData.quantity} ${orderData.unit} of "${orderData.product_name}". Amount: PKR ${body.paymentAmount}`,
        po_id: body.id,
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  }
  if (body.status === "fulfilled") {
    updates.fulfilled_at = body.fulfilledAt || new Date().toISOString();
    updates.fulfilled_by = body.fulfilledBy;
    
    // Update product stock and add to history
    if (body.productName && body.quantity) {
      console.log("Looking for product:", body.productName);
      
      // Find the product by name
      const { data: products, error: productError } = await supabaseAdmin
        .from("products")
        .select("*")
        .ilike("name", body.productName)
        .limit(1);
      
      console.log("Found products:", products);
      console.log("Product search error:", productError);
      
      if (products && products.length > 0) {
        const product = products[0];
        const newStock = product.stock - body.quantity;
        
        console.log(`Updating stock from ${product.stock} to ${newStock}`);
        
        // Update product stock
        const { error: updateError } = await supabaseAdmin
          .from("products")
          .update({ stock: newStock })
          .eq("id", product.id);
        
        console.log("Stock update error:", updateError);
        
        // Add to product history
        const { error: historyError } = await supabaseAdmin.from("product_history").insert({
          id: Date.now().toString(),
          product_id: product.id,
          product_name: product.name,
          action: "client_ordered",
          quantity_change: body.quantity,
          stock_before: product.stock,
          stock_after: newStock,
          note: `Client order fulfilled - ${body.clientName || 'Client'} - Order #${body.id.slice(0, 8)}`,
          created_by: body.fulfilledBy || "system",
          snapshot_image: product.images?.[0] || null,
          snapshot_price: product.price || 0,
          snapshot_unit: product.unit || "pieces",
          created_at: new Date().toISOString(),
        });
        
        console.log("History insert error:", historyError);
      } else {
        console.log("No product found with name:", body.productName);
      }
    } else {
      console.log("Missing productName or quantity:", { productName: body.productName, quantity: body.quantity });
    }
  }

  console.log("Updating order with:", updates); // Debug log
  
  const { data, error } = await supabaseAdmin.from("crm_orders").update(updates).eq("id", body.id).select().single();
  
  if (error) {
    console.error("Error updating order:", error); // Debug log
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("crm_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
