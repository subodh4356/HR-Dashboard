'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { endOfMonth, parseISO, format } from 'date-fns'

// CONFIGURABLE CONSTANT: Daily rate working days divisor
const FIXED_WORKING_DIVISOR = 22

// --- ZOD SCHEMAS & TYPES FOR OUTWARD BOUNDARIES ---

const PayslipSchema = z.object({
  id: z.string().uuid(),
  employee_id: z.string().uuid(),
  salary_structure_id: z.string().uuid(),
  pay_period_start: z.string(),
  pay_period_end: z.string(),
  working_days: z.number().int(),
  present_days: z.number().int(),
  unpaid_leave_days: z.number().int(),
  gross_pay: z.number(),
  total_deductions: z.number(),
  net_pay: z.number(),
  status: z.enum(['Draft', 'Processing', 'Paid']),
  generated_at: z.string(),
})

export type Payslip = z.infer<typeof PayslipSchema>

const PayslipWithRelationSchema = PayslipSchema.extend({
  employee: z.object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
  }).nullable().optional(),
  salary_structure: z.object({
    base_salary: z.number(),
    hra: z.number(),
    da: z.number(),
    tax_deduction: z.number(),
    pf_deduction: z.number(),
  }).nullable().optional(),
})

export type PayslipWithRelation = z.infer<typeof PayslipWithRelationSchema>

// Helper to count weekdays (Monday to Friday) in a range
function getWeekdaysCount(start: Date, end: Date): number {
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

// --- SERVER ACTIONS ---

/**
 * Server Action to generate or recalculate a monthly payslip.
 * @param employeeId Employee ID.
 * @param payPeriodStart ISO date string representing the first day of the pay period (e.g. YYYY-MM-01).
 */
export async function generatePayslipAction(
  employeeId: string,
  payPeriodStart: string
): Promise<{ data: Payslip | null; error: string | null }> {
  try {
    // Validate inputs
    const parsedEmployeeId = z.string().uuid().parse(employeeId)
    const parsedStartStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(payPeriodStart)

    const startDate = parseISO(parsedStartStr)
    const endDate = endOfMonth(startDate)
    const payPeriodEndStr = format(endDate, 'yyyy-MM-dd')

    const supabase = createAdminClient()

    // 1. Fetch the active salary structure for this employee
    const { data: activeStructure, error: structError } = await supabase
      .from('salary_structure')
      .select('*')
      .eq('employee_id', parsedEmployeeId)
      .lte('effective_from', parsedStartStr)
      .order('effective_from', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (structError) {
      return { data: null, error: `Error fetching salary structure: ${structError.message}` }
    }

    if (!activeStructure) {
      return {
        data: null,
        error: `No active salary structure found for employee ${parsedEmployeeId} effective on or before ${parsedStartStr}. Please set one up first.`,
      }
    }

    // 2. Fetch attendance and leave records to determine unpaid days
    const { data: attendanceLogs, error: attError } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('employee_id', parsedEmployeeId)
      .gte('date', parsedStartStr)
      .lte('date', payPeriodEndStr)

    if (attError) {
      return { data: null, error: `Error querying attendance: ${attError.message}` }
    }

    // ASSUMPTION: The relationship in leave_request table to leave_policy uses the key leave_request_leave_policy_id_fkey
    const { data: leaveRequests, error: leaveError } = await supabase
      .from('leave_request')
      .select('start_date, end_date, leave_policy!leave_request_leave_policy_id_fkey(name)')
      .eq('employee_id', parsedEmployeeId)
      .in('status', ['approved', 'Approved'])

    if (leaveError) {
      return { data: null, error: `Error querying leaves: ${leaveError.message}` }
    }

    // Use a Set to store unique dates that are unpaid, avoiding double-counting (e.g. if marked absent on a planned unpaid leave day)
    const unpaidDates = new Set<string>()

    // Add Absent days from attendance logs
    if (attendanceLogs) {
      attendanceLogs.forEach((log) => {
        if (log.status?.toLowerCase() === 'absent') {
          unpaidDates.add(log.date)
        }
      })
    }

    // Add dates spanned by approved unpaid leaves
    if (leaveRequests) {
      leaveRequests.forEach((leave) => {
        const policyName = (leave.leave_policy as any)?.name
        if (policyName?.toLowerCase() === 'unpaid') {
          const start = new Date(leave.start_date)
          const end = new Date(leave.end_date)
          const cur = new Date(start)
          while (cur <= end) {
            const dateStr = format(cur, 'yyyy-MM-dd')
            if (dateStr >= parsedStartStr && dateStr <= payPeriodEndStr) {
              unpaidDates.add(dateStr)
            }
            cur.setDate(cur.getDate() + 1)
          }
        }
      })
    }

    // 3. Perform Calculations
    const workingDays = getWeekdaysCount(startDate, endDate)
    const unpaidLeaveDays = unpaidDates.size
    const presentDays = Math.max(0, workingDays - unpaidLeaveDays)

    const baseSalary = Number(activeStructure.base_salary)
    const hra = Number(activeStructure.hra)
    const da = Number(activeStructure.da)
    const taxDeduction = Number(activeStructure.tax_deduction)
    const pfDeduction = Number(activeStructure.pf_deduction)

    // Daily rate calculation with fixed divisor (CONFIGURABLE CONSTANT)
    const dailyRate = baseSalary / FIXED_WORKING_DIVISOR
    const grossPay = (dailyRate * presentDays) + hra + da
    const totalDeductions = taxDeduction + pfDeduction
    const netPay = Math.max(0, grossPay - totalDeductions)

    // 4. Upsert the generated payslip into Supabase
    const { data: payslip, error: upsertError } = await supabase
      .from('payslips')
      .upsert({
        employee_id: parsedEmployeeId,
        salary_structure_id: activeStructure.id,
        pay_period_start: parsedStartStr,
        pay_period_end: payPeriodEndStr,
        working_days: workingDays,
        present_days: presentDays,
        unpaid_leave_days: unpaidLeaveDays,
        gross_pay: Number(grossPay.toFixed(2)),
        total_deductions: Number(totalDeductions.toFixed(2)),
        net_pay: Number(netPay.toFixed(2)),
        status: 'Draft',
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'employee_id,pay_period_start,pay_period_end',
      })
      .select()
      .single()

    if (upsertError) {
      return { data: null, error: `Error saving payslip: ${upsertError.message}` }
    }

    const validated = PayslipSchema.parse(payslip)
    return { data: validated, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}

/**
 * Server Action to retrieve payslips for an employee or all payslips for Admin/HR review.
 * @param employeeId Optional Employee ID filter. If omitted, retrieves all records (for Admin/HR).
 */
export async function getPayslipsAction(
  employeeId?: string
): Promise<{ data: PayslipWithRelation[] | null; error: string | null }> {
  try {
    const supabase = createAdminClient()
    let query = supabase
      .from('payslips')
      .select(`
        *,
        employee:employee_id (
          first_name,
          last_name,
          email
        ),
        salary_structure:salary_structure_id (
          base_salary,
          hra,
          da,
          tax_deduction,
          pf_deduction
        )
      `)

    if (employeeId) {
      const parsedId = z.string().uuid().parse(employeeId)
      query = query.eq('employee_id', parsedId)
    }

    const { data, error } = await query.order('pay_period_start', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    // Validate using Zod array schema
    const validated = z.array(PayslipWithRelationSchema).parse(data)
    return { data: validated, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}

/**
 * Server Action to add or update an employee's salary structure.
 */
export async function upsertSalaryStructureAction(data: {
  employeeId: string
  baseSalary: number
  hra: number
  da: number
  taxDeduction: number
  pfDeduction: number
  effectiveFrom: string
}): Promise<{ data: any | null; error: string | null }> {
  try {
    const supabase = createAdminClient()
    const { data: result, error } = await supabase
      .from('salary_structure')
      .insert({
        employee_id: data.employeeId,
        base_salary: data.baseSalary,
        hra: data.hra,
        da: data.da,
        tax_deduction: data.taxDeduction,
        pf_deduction: data.pfDeduction,
        effective_from: data.effectiveFrom,
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }
    return { data: result, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}

/**
 * Server Action to update the payment status of a payslip.
 */
export async function updatePayslipStatusAction(
  payslipId: string,
  status: 'Draft' | 'Processing' | 'Paid'
): Promise<{ data: any | null; error: string | null }> {
  try {
    const supabase = createAdminClient()
    const { data: result, error } = await supabase
      .from('payslips')
      .update({ status })
      .eq('id', payslipId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }
    return { data: result, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}
