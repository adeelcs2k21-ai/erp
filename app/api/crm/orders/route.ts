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
  }
  if (body.status === "po_sent") {
    updates.po_sent_at = new Date().toISOString();
  }
  if (body.status === "payment_confirmed") {
    updates.payment_amount = body.paymentAmount;
    updates.payment_method = body.paymentMethod;
    updates.payment_confirmed_at = new Date().toISOString();
    updates.payment_confirmed_by = body.confirmedBy;
  }

  const { data, error } = await supabaseAdmin.from("crm_orders").update(updates).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("crm_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
