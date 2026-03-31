import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("payroll")
    .select(`
      *,
      employees!inner(first_name, last_name, employee_id)
    `)
    .order("pay_period_start", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Format the data to include employee name
  const formattedData = data?.map(payroll => ({
    ...payroll,
    employee_name: `${payroll.employees.first_name} ${payroll.employees.last_name}`,
  }));

  return NextResponse.json(formattedData);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = Date.now().toString();

  // Calculate net salary
  const grossSalary = body.basic_salary + (body.overtime_pay || 0) + (body.bonuses || 0) + (body.allowances || 0);
  const totalDeductions = (body.deductions || 0) + (body.tax_deduction || 0);
  const netSalary = grossSalary - totalDeductions;

  const newPayroll = {
    id,
    employee_id: body.employee_id,
    pay_period_start: body.pay_period_start,
    pay_period_end: body.pay_period_end,
    basic_salary: body.basic_salary,
    overtime_pay: body.overtime_pay || 0,
    bonuses: body.bonuses || 0,
    allowances: body.allowances || 0,
    deductions: body.deductions || 0,
    tax_deduction: body.tax_deduction || 0,
    net_salary: netSalary,
    status: "draft",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("payroll")
    .insert(newPayroll)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  
  // Recalculate net salary if amounts changed
  const grossSalary = body.basic_salary + (body.overtime_pay || 0) + (body.bonuses || 0) + (body.allowances || 0);
  const totalDeductions = (body.deductions || 0) + (body.tax_deduction || 0);
  const netSalary = grossSalary - totalDeductions;

  const { data, error } = await supabaseAdmin
    .from("payroll")
    .update({
      basic_salary: body.basic_salary,
      overtime_pay: body.overtime_pay,
      bonuses: body.bonuses,
      allowances: body.allowances,
      deductions: body.deductions,
      tax_deduction: body.tax_deduction,
      net_salary: netSalary,
      status: body.status,
      processed_by: body.processed_by,
      processed_at: body.processed_at,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}