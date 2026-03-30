import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bomId = searchParams.get("bomId");

  let query = supabaseAdmin.from("bom_rates").select("*");
  if (bomId) query = query.eq("id", bomId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (bomId) {
    return Response.json(data[0] ? { id: data[0].id, ...data[0].data } : {});
  }
  return Response.json(data.map((r: any) => ({ id: r.id, ...r.data })));
}

export async function POST(request: Request) {
  const { bomId, rates } = await request.json();

  // Upsert by bomId used as id
  const { data: existing } = await supabaseAdmin.from("bom_rates").select("*").eq("id", bomId).single();

  const merged = { ...(existing?.data || {}), ...rates, updatedAt: new Date().toISOString() };

  const { data, error } = existing
    ? await supabaseAdmin.from("bom_rates").update({ data: merged, updated_at: new Date().toISOString() }).eq("id", bomId).select().single()
    : await supabaseAdmin.from("bom_rates").insert({ id: bomId, data: merged, created_at: new Date().toISOString() }).select().single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id, ...data.data }, { status: 201 });
}
