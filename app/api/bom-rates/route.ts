import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("bom_rates").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Flatten data field for backwards compatibility
  return NextResponse.json(data.map((r: any) => ({ id: r.id, created_at: r.created_at, ...r.data })));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newRate = { id: Date.now().toString(), data: body, created_at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin.from("bom_rates").insert(newRate).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, created_at: data.created_at, ...data.data });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body;
  const { data, error } = await supabaseAdmin
    .from("bom_rates")
    .update({ data: rest, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, ...data.data });
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("bom_rates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
