import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("inventory_receiving").select("*").order("received_date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with supplier name from bom_invoices
  const invoiceIds = data.map((r: any) => r.bom_invoice_id).filter(Boolean);
  const { data: invoices } = await supabaseAdmin.from("bom_invoices").select("id, supplier_name").in("id", invoiceIds);
  const invoiceMap: any = {};
  (invoices || []).forEach((inv: any) => { invoiceMap[inv.id] = inv.supplier_name; });

  return NextResponse.json(data.map((r: any) => ({
    ...r,
    bomInvoiceId: r.bom_invoice_id,
    bomNumber: r.bom_number,
    receivedBy: r.received_by,
    receivedDate: r.received_date,
    supplierName: invoiceMap[r.bom_invoice_id] || 'Unknown',
  })));
}

export async function POST(request: NextRequest) {
  const { bomInvoiceId, bomNumber, items, receivedBy, notes } = await request.json();
  const newReceiving = {
    id: Date.now().toString(),
    bom_invoice_id: bomInvoiceId,
    bom_number: bomNumber,
    items: items.map((item: any) => ({ ...item, receivedDate: new Date().toISOString(), receivedBy, status: "received" })),
    received_by: receivedBy,
    received_date: new Date().toISOString(),
    notes,
    status: "completed",
  };
  const { data, error } = await supabaseAdmin.from("inventory_receiving").insert(newReceiving).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, receiving: data });
}
