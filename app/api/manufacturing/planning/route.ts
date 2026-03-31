import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productionId = request.nextUrl.searchParams.get("production_id");

  const { data, error } = await supabaseAdmin
    .from("production_planning")
    .select("*")
    .eq("production_request_id", productionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const materialId = Date.now().toString();

  const newMaterial = {
    id: materialId,
    production_request_id: body.production_request_id,
    material_name: body.material_name,
    quantity_required: body.quantity_required,
    quantity_allocated: 0,
    unit: body.unit,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("production_planning")
    .insert(newMaterial)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("production_planning")
    .update({
      quantity_allocated: body.quantity_allocated,
      status: body.status,
      allocated_at: body.allocated_at,
      issued_at: body.issued_at,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
