import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("departments")
    .select(`
      *,
      head:employees!departments_head_id_fkey(first_name, last_name, employee_id)
    `)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = Date.now().toString();

  const newDepartment = {
    id,
    name: body.name,
    description: body.description,
    head_id: body.head_id,
    budget: body.budget,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("departments")
    .insert(newDepartment)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("departments")
    .update({
      name: body.name,
      description: body.description,
      head_id: body.head_id,
      budget: body.budget,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { error } = await supabaseAdmin
    .from("departments")
    .delete()
    .eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}