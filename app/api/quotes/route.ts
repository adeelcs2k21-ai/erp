import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supplierId = request.nextUrl.searchParams.get("supplierId");
  const bomId = request.nextUrl.searchParams.get("bomId");

  let query = supabaseAdmin.from("quotes").select("*").order("created_at", { ascending: false });
  if (supplierId) query = query.eq("supplier_id", supplierId);
  if (bomId) query = query.eq("bom_id", bomId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newQuote = {
    id: Date.now().toString(),
    bom_id: body.bomId,
    bom_number: body.bomNumber,
    supplier_id: body.supplierId,
    supplier_name: body.supplierName,
    items: body.items,
    total_rate: body.totalRate,
    transport_cost: body.transportCost || 0,
    tax: body.tax || 0,
    total_amount: body.totalAmount,
    notes: body.notes || "",
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("quotes").insert(newQuote).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("quotes").update(body).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("quotes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
