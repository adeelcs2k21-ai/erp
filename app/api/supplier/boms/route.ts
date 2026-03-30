import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");

  let query = supabaseAdmin.from("bom_sends").select("*").order("sent_at", { ascending: false });
  if (supplierId) query = query.eq("supplier_id", supplierId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Map snake_case to camelCase for frontend compatibility
  return Response.json(data.map((s: any) => ({
    ...s,
    bomId: s.bom_id,
    bomNumber: s.bom_number,
    supplierId: s.supplier_id,
    supplierName: s.supplier_name,
    supplierPhone: s.supplier_phone,
    sentAt: s.sent_at,
  })));
}
