import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productionId = request.nextUrl.searchParams.get("production_id");

  const { data, error } = await supabaseAdmin
    .from("production_quality_control")
    .select("*")
    .eq("production_request_id", productionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const qcId = Date.now().toString();

  const newQC = {
    id: qcId,
    production_request_id: body.production_request_id,
    inspector_name: body.inspector_name,
    status: body.status,
    defect_count: body.defect_count,
    defects_found: body.notes,
    notes: body.notes,
    approval_status: "pending",
    inspection_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("production_quality_control")
    .insert(newQC)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("production_quality_control")
    .update({
      status: body.status,
      defect_count: body.defect_count,
      defects_found: body.defects_found,
      notes: body.notes,
      approval_status: body.approval_status,
      approved_by: body.approved_by,
      approved_at: body.approved_at,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
