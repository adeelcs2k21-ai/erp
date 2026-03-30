import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("orders").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const newOrder = {
    id: Date.now().toString(),
    customer_name: body.customerName,
    customer_email: body.customerEmail,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("orders").insert(newOrder).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status: body.status })
    .eq("id", body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If completed, upsert client
  if (body.status === "completed" && data) {
    const existing = await supabaseAdmin.from("clients").select("id").eq("email", data.customer_email).single();
    if (!existing.data) {
      await supabaseAdmin.from("clients").insert({
        id: Date.now().toString(),
        name: data.customer_name,
        email: data.customer_email,
        first_order_date: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json(data);
}
