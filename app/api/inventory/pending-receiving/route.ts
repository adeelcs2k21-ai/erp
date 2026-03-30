import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data: invoices, error: e1 } = await supabaseAdmin
    .from("bom_invoices")
    .select("*")
    .eq("status", "approved");
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  const { data: received, error: e2 } = await supabaseAdmin
    .from("inventory_receiving")
    .select("bom_invoice_id");
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  const receivedIds = received.map((r: any) => r.bom_invoice_id);
  const pending = invoices.filter((inv: any) => !receivedIds.includes(inv.id));

  return NextResponse.json(pending.map((inv: any) => ({
    ...inv,
    bomId: inv.bom_id,
    bomNumber: inv.bom_number,
    bomData: inv.bom_data,
    bestQuote: inv.best_quote,
    totalAmount: inv.total_amount,
    supplierName: inv.supplier_name,
    deliveryDate: inv.delivery_date,
    createdBy: inv.created_by,
  })));
}
