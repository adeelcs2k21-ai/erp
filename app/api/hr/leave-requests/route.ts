import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .select(`
      *,
      employees!inner(first_name, last_name, employee_id)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Format the data to include employee name
  const formattedData = data?.map(leave => ({
    ...leave,
    employee_name: `${leave.employees.first_name} ${leave.employees.last_name}`,
  }));

  return NextResponse.json(formattedData);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = Date.now().toString();

  // Calculate total days
  const startDate = new Date(body.start_date);
  const endDate = new Date(body.end_date);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const newLeaveRequest = {
    id,
    employee_id: body.employee_id,
    leave_type: body.leave_type,
    start_date: body.start_date,
    end_date: body.end_date,
    total_days: totalDays,
    reason: body.reason,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .insert(newLeaveRequest)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { data, error } = await supabaseAdmin
    .from("leave_requests")
    .update({
      status: body.status,
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