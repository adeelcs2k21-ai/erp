import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const { data, error } = await supabaseAdmin.from("suppliers").select("*").eq("id", params.id).single();
  if (error) return Response.json({ error: "Supplier not found" }, { status: 404 });
  return Response.json(data);
}
