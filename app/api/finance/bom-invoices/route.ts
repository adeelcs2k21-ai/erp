import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("bom_invoices").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Map snake_case to camelCase for frontend
  return NextResponse.json(data.map((inv: any) => ({
    ...inv,
    bomId: inv.bom_id,
    bomNumber: inv.bom_number,
    bomData: inv.bom_data,
    bestQuote: inv.best_quote,
    totalAmount: inv.total_amount,
    supplierName: inv.supplier_name,
    deliveryDate: inv.delivery_date,
    createdBy: inv.created_by,
    createdAt: inv.created_at,
    updatedAt: inv.updated_at,
  })));
}

export async function POST(request: NextRequest) {
  const { bomId, bomData, bestQuote, status } = await request.json();

  // Check if already exists for this BOM
  const { data: existing } = await supabaseAdmin.from("bom_invoices").select("id").eq("bom_id", bomId).single();
  if (existing) {
    return NextResponse.json({ success: true, message: "Already sent to finance" });
  }

  const newInvoice = {
    id: Date.now().toString(),
    bom_id: bomId,
    bom_number: bomData.poNumber,
    bom_data: bomData,
    best_quote: bestQuote,
    status,
    created_by: bomData.createdBy,
    total_amount: bestQuote.totalAmount,
    supplier_name: bestQuote.supplierName,
    delivery_date: bomData.deliveryDate,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("bom_invoices").insert(newInvoice).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, invoice: data });
}

export async function PUT(request: NextRequest) {
  const { id, status } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("bom_invoices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, invoice: data });
}
