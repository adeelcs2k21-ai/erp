import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("suppliers").select("*").eq("id", id).single();
  if (error) return Response.json({ error: "Supplier not found" }, { status: 404 });
  return Response.json(data);
}
