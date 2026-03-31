import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productionId = request.nextUrl.searchParams.get("production_id");

  const { data, error } = await supabaseAdmin
    .from("production_storage")
    .select("*")
    .eq("production_request_id", productionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const storageId = Date.now().toString();
  const batchNumber = `BATCH-${Date.now()}`;

  const newStorage = {
    id: storageId,
    production_request_id: body.production_request_id,
    product_name: body.product_name,
    quantity_produced: body.quantity_produced,
    quantity_stored: body.quantity_produced,
    batch_number: batchNumber,
    storage_location: body.storage_location,
    label_status: "pending",
    stored_by: body.stored_by || "system",
    stored_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("production_storage")
    .insert(newStorage)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("production_storage")
    .update({
      label_status: body.label_status,
      storage_location: body.storage_location,
      stored_by: body.stored_by,
      stored_at: body.stored_at,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
