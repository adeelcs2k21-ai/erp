import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

async function addNotification(notification: any) {
  await supabaseAdmin.from("notifications").insert({
    id: Date.now().toString(),
    ...notification,
    created_at: new Date().toISOString(),
  });
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from("purchase_orders").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Map snake_case back to camelCase for the frontend
  return NextResponse.json(data.map((o: any) => ({
    ...o,
    poNumber: o.po_number,
    deliveryDate: o.delivery_date,
    paymentTerms: o.payment_terms,
    totalAmount: o.total_amount,
    createdBy: o.created_by,
    createdAt: o.created_at,
    rejectionRemarks: o.rejection_remarks,
  })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const order = {
    id: Date.now().toString(),
    po_number: `BOM-${Date.now()}`,
    items: body.items,
    delivery_date: body.deliveryDate,
    payment_terms: body.paymentTerms,
    notes: body.notes,
    total_amount: body.totalAmount,
    status: "pending_approval",
    created_by: body.createdBy,
    suppliers: body.suppliers || [],
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin.from("purchase_orders").insert(order).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await addNotification({
    user_id: "superadmin",
    type: "po_pending_approval",
    title: "New Bill of Material Pending Approval",
    message: `BOM ${order.po_number} requires your approval. Total: PKR ${order.total_amount.toFixed(2)}`,
    po_id: order.id,
    read: false,
  });

  return NextResponse.json({ ...data, poNumber: data.po_number, deliveryDate: data.delivery_date, paymentTerms: data.payment_terms, totalAmount: data.total_amount, createdBy: data.created_by, createdAt: data.created_at });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data: existing } = await supabaseAdmin.from("purchase_orders").select("*").eq("id", body.id).single();
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updatePayload: any = { status: body.status };
  if (body.rejectionRemarks) updatePayload.rejection_remarks = body.rejectionRemarks;

  const { data, error } = await supabaseAdmin
    .from("purchase_orders")
    .update(updatePayload)
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.status === "approved") {
    await addNotification({
      user_id: body.createdBy || existing.created_by,
      type: "po_approved",
      title: "Bill of Material Approved",
      message: `BOM ${existing.po_number} has been approved.`,
      po_id: existing.id,
      read: false,
    });
  } else if (body.status === "rejected") {
    await addNotification({
      user_id: body.createdBy || existing.created_by,
      type: "po_rejected",
      title: "Bill of Material Rejected",
      message: `BOM ${existing.po_number} has been rejected. Remarks: ${body.rejectionRemarks || "No remarks provided"}`,
      po_id: existing.id,
      read: false,
    });
  }

  return NextResponse.json({ ...data, poNumber: data.po_number, deliveryDate: data.delivery_date, paymentTerms: data.payment_terms, totalAmount: data.total_amount, createdBy: data.created_by, createdAt: data.created_at });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("purchase_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
