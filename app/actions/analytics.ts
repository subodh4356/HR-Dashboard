'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'

// ASSUMPTION: The Next.js server runs in an environment where the SUPABASE_SERVICE_ROLE_KEY is correctly set.

// --- ZOD SCHEMAS & TYPES FOR OUTWARD BOUNDARIES ---

const AttritionResultSchema = z.object({
  attrition_rate: z.number(),
  headcount_delta: z.number(),
})

export type AttritionResult = z.infer<typeof AttritionResultSchema>

const DepartmentAttendanceTrendSchema = z.array(
  z.object({
    month: z.string(),
    department: z.string(),
    attendance_rate: z.number(),
  })
)

export type DepartmentAttendanceTrend = z.infer<typeof DepartmentAttendanceTrendSchema>

const RecruitmentFunnelCountSchema = z.array(
  z.object({
    stage: z.string(),
    count: z.coerce.number(),
  })
)

export type RecruitmentFunnelCount = z.infer<typeof RecruitmentFunnelCountSchema>

// --- SERVER ACTIONS ---

/**
 * Server Action to retrieve the monthly attrition rate and headcount delta.
 * @param targetMonth The target date string in ISO format (YYYY-MM-DD).
 */
export async function getMonthlyAttritionRateAction(
  targetMonth: string
): Promise<{ data: AttritionResult | null; error: string | null }> {
  try {
    // Validate parameter format
    const parsedDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(targetMonth)
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('get_monthly_attrition_rate', {
      target_month: parsedDate,
    })

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data || data.length === 0) {
      return { data: { attrition_rate: 0, headcount_delta: 0 }, error: null }
    }

    // Since RPC returns a table/array, we parse the first element
    const validated = AttritionResultSchema.parse(data[0])
    return { data: validated, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}

/**
 * Server Action to retrieve the department attendance trends.
 * @param monthsBack Number of months back to analyze.
 */
export async function getDepartmentAttendanceTrendAction(
  monthsBack: number
): Promise<{ data: DepartmentAttendanceTrend | null; error: string | null }> {
  try {
    const parsedMonthsBack = z.number().int().nonnegative().parse(monthsBack)
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('get_department_attendance_trend', {
      months_back: parsedMonthsBack,
    })

    if (error) {
      return { data: null, error: error.message }
    }

    const validated = DepartmentAttendanceTrendSchema.parse(data)
    return { data: validated, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}

/**
 * Server Action to retrieve recruitment stage counts for the funnel.
 */
export async function getRecruitmentFunnelCountsAction(): Promise<{
  data: RecruitmentFunnelCount | null
  error: string | null
}> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc('get_recruitment_funnel_counts')

    if (error) {
      return { data: null, error: error.message }
    }

    const validated = RecruitmentFunnelCountSchema.parse(data)
    return { data: validated, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred.',
    }
  }
}
