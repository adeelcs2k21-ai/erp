import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("suppliers").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newSupplier = {
    id: Date.now().toString(),
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    contact_person: body.contactPerson || body.contact_person,
    business_type: body.businessType || body.business_type,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("suppliers").insert(newSupplier).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("suppliers")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json();
  const { error } = await supabaseAdmin.from("suppliers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
