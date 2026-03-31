import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("manufacturing_production_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const productionId = Date.now().toString();
  const productionNumber = `PROD-${Date.now()}`;

  const newProduction = {
    id: productionId,
    production_number: productionNumber,
    product_name: body.product_name,
    quantity: body.quantity,
    unit: body.unit,
    status: "pending_approval",
    approval_status: "pending",
    created_by: body.created_by,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("manufacturing_production_requests")
    .insert(newProduction)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("manufacturing_production_requests")
    .update({
      status: body.status,
      approval_status: body.approval_status,
      approved_by: body.approved_by,
      approved_at: body.approved_at,
      rejection_reason: body.rejection_reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
