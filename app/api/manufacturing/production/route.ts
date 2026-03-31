import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const productionId = request.nextUrl.searchParams.get("production_id");

  const { data, error } = await supabaseAdmin
    .from("production_workers")
    .select("*")
    .eq("production_request_id", productionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const workerId = Date.now().toString();

  const newWorker = {
    id: workerId,
    production_request_id: body.production_request_id,
    worker_name: body.worker_name,
    worker_role: body.worker_role,
    task_description: body.task_description,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("production_workers")
    .insert(newWorker)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("production_workers")
    .update({
      status: body.status,
      start_time: body.start_time,
      end_time: body.end_time,
      notes: body.notes,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
