import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const payrollId = Date.now().toString();

  try {
    // Get employee details
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("id", body.employee_id)
      .single();

    if (empError || !employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Get attendance records for the pay period
    const { data: attendanceRecords, error: attError } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", body.employee_id)
      .gte("date", body.pay_period_start)
      .lte("date", body.pay_period_end);

    if (attError) {
      return NextResponse.json({ error: attError.message }, { status: 500 });
    }

    // Calculate totals from attendance
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalAbsentDays = 0;

    attendanceRecords?.forEach(record => {
      if (record.status === "present" || record.status === "late") {
        totalRegularHours += record.regular_hours || 0;
        totalOvertimeHours += record.overtime_hours || 0;
      } else if (record.status === "absent") {
        totalAbsentDays += 1;
      } else if (record.status === "half_day") {
        totalRegularHours += (employee.working_hours_per_day || 8) / 2;
      }
    });

    // Calculate pay
    const monthlySalary = employee.salary || 0;
    const hourlyRate = employee.hourly_rate || (monthlySalary / (22 * (employee.working_hours_per_day || 8))); // Assuming 22 working days per month
    const overtimeRate = hourlyRate * 1.5; // 1.5x for overtime

    // Calculate basic salary (pro-rated if needed)
    const workingDaysInPeriod = getWorkingDaysBetween(new Date(body.pay_period_start), new Date(body.pay_period_end));
    const expectedWorkingDays = workingDaysInPeriod;
    const actualWorkingDays = attendanceRecords?.filter(r => r.status === "present" || r.status === "late" || r.status === "half_day").length || 0;
    
    let basicSalary = monthlySalary;
    if (employee.employment_type === "hourly" || employee.employment_type === "part_time") {
      basicSalary = totalRegularHours * hourlyRate;
    } else {
      // Pro-rate salary based on attendance for salaried employees
      basicSalary = (monthlySalary / expectedWorkingDays) * actualWorkingDays;
    }

    const overtimePay = totalOvertimeHours * overtimeRate;
    const bonuses = body.bonuses || 0;
    const allowances = body.allowances || 0;
    const deductions = body.deductions || 0;
    
    // Calculate tax (simple 10% tax rate - you can make this more sophisticated)
    const taxableIncome = basicSalary + overtimePay + bonuses + allowances;
    const taxDeduction = taxableIncome * 0.10;
    
    // Calculate leave deduction for unpaid absences
    const unpaidLeaveDays = Math.max(0, totalAbsentDays - (employee.sick_leave_days || 0));
    const leaveDeduction = unpaidLeaveDays * (monthlySalary / 30); // Daily rate

    const grossSalary = basicSalary + overtimePay + bonuses + allowances;
    const totalDeductions = deductions + taxDeduction + leaveDeduction;
    const netSalary = grossSalary - totalDeductions;

    // Create payroll record
    const newPayroll = {
      id: payrollId,
      employee_id: body.employee_id,
      pay_period_start: body.pay_period_start,
      pay_period_end: body.pay_period_end,
      basic_salary: Math.round(basicSalary * 100) / 100,
      regular_hours: Math.round(totalRegularHours * 100) / 100,
      overtime_hours: Math.round(totalOvertimeHours * 100) / 100,
      overtime_pay: Math.round(overtimePay * 100) / 100,
      bonuses: bonuses,
      allowances: allowances,
      deductions: deductions,
      tax_deduction: Math.round(taxDeduction * 100) / 100,
      leave_deduction: Math.round(leaveDeduction * 100) / 100,
      gross_salary: Math.round(grossSalary * 100) / 100,
      net_salary: Math.round(netSalary * 100) / 100,
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

  } catch (error) {
    console.error("Payroll generation error:", error);
    return NextResponse.json({ error: "Failed to generate payroll" }, { status: 500 });
  }
}

// Helper function to calculate working days between two dates
function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}