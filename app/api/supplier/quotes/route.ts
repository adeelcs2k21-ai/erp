import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("supplier_quotes").select("*").order("created_at", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map((r: any) => ({ id: r.id, created_at: r.created_at, ...r.data })));
}

export async function POST(request: Request) {
  const body = await request.json();
  const newQuote = {
    id: Date.now().toString(),
    data: { ...body, submittedAt: new Date().toISOString(), status: "submitted" },
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("supplier_quotes").insert(newQuote).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ id: data.id, ...data.data }, { status: 201 });
}
