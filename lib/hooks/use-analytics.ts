import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  getMonthlyAttritionRateAction,
  getDepartmentAttendanceTrendAction,
  getRecruitmentFunnelCountsAction,
  AttritionResult,
  DepartmentAttendanceTrend,
  RecruitmentFunnelCount,
} from '@/app/actions/analytics'

// --- QUERY KEYS FACTORY ---
export const analyticsKeys = {
  all: ['analytics'] as const,
  attrition: (targetMonth: string) => [...analyticsKeys.all, 'attrition', targetMonth] as const,
  attendance: (monthsBack: number) => [...analyticsKeys.all, 'attendance', monthsBack] as const,
  recruitment: () => [...analyticsKeys.all, 'recruitment'] as const,
}

// --- HOOKS ---

/**
 * Hook to retrieve monthly attrition rate and headcount delta.
 * @param targetMonth Date string in YYYY-MM-DD format.
 */
export function useMonthlyAttritionRate(
  targetMonth: string
): UseQueryResult<AttritionResult, Error> {
  const query = useQuery<AttritionResult, Error>({
    queryKey: analyticsKeys.attrition(targetMonth),
    queryFn: async () => {
      const { data, error } = await getMonthlyAttritionRateAction(targetMonth)
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No attrition data returned.')
      }
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  useEffect(() => {
    if (query.error) {
      toast.error(`Failed to load attrition rate: ${query.error.message}`)
    }
  }, [query.error])

  return query
}

/**
 * Hook to retrieve monthly department attendance trends.
 * @param monthsBack Number of months to look back.
 */
export function useDepartmentAttendanceTrend(
  monthsBack: number
): UseQueryResult<DepartmentAttendanceTrend, Error> {
  const query = useQuery<DepartmentAttendanceTrend, Error>({
    queryKey: analyticsKeys.attendance(monthsBack),
    queryFn: async () => {
      const { data, error } = await getDepartmentAttendanceTrendAction(monthsBack)
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No attendance trend data returned.')
      }
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  useEffect(() => {
    if (query.error) {
      toast.error(`Failed to load attendance trends: ${query.error.message}`)
    }
  }, [query.error])

  return query
}

/**
 * Hook to retrieve stage counts for the recruitment funnel.
 */
export function useRecruitmentFunnelCounts(): UseQueryResult<RecruitmentFunnelCount, Error> {
  const query = useQuery<RecruitmentFunnelCount, Error>({
    queryKey: analyticsKeys.recruitment(),
    queryFn: async () => {
      const { data, error } = await getRecruitmentFunnelCountsAction()
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No recruitment funnel data returned.')
      }
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  useEffect(() => {
    if (query.error) {
      toast.error(`Failed to load recruitment funnel: ${query.error.message}`)
    }
  }, [query.error])

  return query
}
