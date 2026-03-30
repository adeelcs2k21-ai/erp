import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("bom_sends").select("*").order("sent_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data.map((s: any) => ({
    ...s,
    bomId: s.bom_id,
    bomNumber: s.bom_number,
    supplierId: s.supplier_id,
    supplierName: s.supplier_name,
    supplierPhone: s.supplier_phone,
    sentAt: s.sent_at,
  })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newSend = {
    id: Date.now().toString(),
    bom_id: body.bomId,
    bom_number: body.bomNumber,
    supplier_id: body.supplierId,
    supplier_name: body.supplierName,
    supplier_phone: body.supplierPhone,
    status: "sent",
    sent_at: new Date().toISOString(),
    items: body.items,
  };
  const { data, error } = await supabaseAdmin.from("bom_sends").insert(newSend).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin.from("bom_sends").update(body).eq("id", body.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
