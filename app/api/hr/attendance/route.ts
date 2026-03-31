import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("attendance")
    .select(`
      *,
      employees!inner(first_name, last_name, employee_id, working_hours_per_day)
    `)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Format the data to include employee name
  const formattedData = data?.map(record => ({
    ...record,
    employee_name: `${record.employees.first_name} ${record.employees.last_name}`,
  }));

  return NextResponse.json(formattedData);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = Date.now().toString();

  // Calculate hours
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;
  let breakHours = 0;

  if (body.check_in_time && body.check_out_time) {
    const checkIn = new Date(`${body.date}T${body.check_in_time}`);
    const checkOut = new Date(`${body.date}T${body.check_out_time}`);
    
    // Calculate total work hours
    totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

    // Calculate break hours
    if (body.break_start_time && body.break_end_time) {
      const breakStart = new Date(`${body.date}T${body.break_start_time}`);
      const breakEnd = new Date(`${body.date}T${body.break_end_time}`);
      breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      totalHours -= breakHours;
    }

    // Calculate regular and overtime hours (assuming 8 hours is standard)
    const standardHours = 8;
    if (totalHours <= standardHours) {
      regularHours = totalHours;
      overtimeHours = 0;
    } else {
      regularHours = standardHours;
      overtimeHours = totalHours - standardHours;
    }
  }

  const newAttendance = {
    id,
    employee_id: body.employee_id,
    date: body.date,
    check_in_time: body.check_in_time ? `${body.date}T${body.check_in_time}:00` : null,
    check_out_time: body.check_out_time ? `${body.date}T${body.check_out_time}:00` : null,
    break_start_time: body.break_start_time ? `${body.date}T${body.break_start_time}:00` : null,
    break_end_time: body.break_end_time ? `${body.date}T${body.break_end_time}:00` : null,
    total_hours: Math.round(totalHours * 100) / 100,
    regular_hours: Math.round(regularHours * 100) / 100,
    overtime_hours: Math.round(overtimeHours * 100) / 100,
    break_hours: Math.round(breakHours * 100) / 100,
    status: body.status || "present",
    notes: body.notes,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .insert(newAttendance)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  
  // Recalculate hours if times are updated
  let updateData: any = {
    status: body.status,
    notes: body.notes,
  };

  if (body.check_in_time && body.check_out_time) {
    const checkIn = new Date(`${body.date}T${body.check_in_time}`);
    const checkOut = new Date(`${body.date}T${body.check_out_time}`);
    
    let totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    let breakHours = 0;

    if (body.break_start_time && body.break_end_time) {
      const breakStart = new Date(`${body.date}T${body.break_start_time}`);
      const breakEnd = new Date(`${body.date}T${body.break_end_time}`);
      breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      totalHours -= breakHours;
    }

    const standardHours = 8;
    const regularHours = totalHours <= standardHours ? totalHours : standardHours;
    const overtimeHours = totalHours > standardHours ? totalHours - standardHours : 0;

    updateData = {
      ...updateData,
      check_in_time: body.check_in_time,
      check_out_time: body.check_out_time,
      break_start_time: body.break_start_time,
      break_end_time: body.break_end_time,
      total_hours: Math.round(totalHours * 100) / 100,
      regular_hours: Math.round(regularHours * 100) / 100,
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      break_hours: Math.round(breakHours * 100) / 100,
    };
  }

  const { data, error } = await supabaseAdmin
    .from("attendance")
    .update(updateData)
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}