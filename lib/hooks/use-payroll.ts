import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'
import {
  generatePayslipAction,
  getPayslipsAction,
  upsertSalaryStructureAction,
  updatePayslipStatusAction,
  Payslip,
  PayslipWithRelation,
} from '@/app/actions/payroll'

// --- QUERY KEYS FACTORY ---
export const payrollKeys = {
  all: ['payroll'] as const,
  history: (employeeId?: string) => [...payrollKeys.all, 'history', employeeId || 'all'] as const,
}

// --- HOOKS ---

/**
 * Hook to retrieve payslip history.
 * @param employeeId Optional employee ID filter.
 */
export function usePayslipHistory(
  employeeId?: string
): UseQueryResult<PayslipWithRelation[], Error> {
  const query = useQuery<PayslipWithRelation[], Error>({
    queryKey: payrollKeys.history(employeeId),
    queryFn: async () => {
      const { data, error } = await getPayslipsAction(employeeId)
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('No payroll history records returned.')
      }
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  useEffect(() => {
    if (query.error) {
      toast.error(`Failed to load payroll history: ${query.error.message}`)
    }
  }, [query.error])

  return query
}

interface GeneratePayslipParams {
  employeeId: string
  payPeriodStart: string
}

/**
 * Mutation hook to generate or recalculate a payslip.
 */
export function useGeneratePayslip(): UseMutationResult<
  Payslip,
  Error,
  GeneratePayslipParams
> {
  const queryClient = useQueryClient()

  return useMutation<Payslip, Error, GeneratePayslipParams>({
    mutationFn: async ({ employeeId, payPeriodStart }) => {
      const { data, error } = await generatePayslipAction(employeeId, payPeriodStart)
      if (error) {
        throw new Error(error)
      }
      if (!data) {
        throw new Error('Payslip generation returned no data.')
      }
      return data
    },
    onSuccess: (data, variables) => {
      toast.success('Payslip generated successfully.')
      // Invalidate history query cache for both the specific employee and all history
      queryClient.invalidateQueries({ queryKey: payrollKeys.history(variables.employeeId) })
      queryClient.invalidateQueries({ queryKey: payrollKeys.history() })
    },
    onError: (error) => {
      toast.error(`Failed to generate payslip: ${error.message}`)
    },
  })
}

interface UpsertSalaryStructureParams {
  employeeId: string
  baseSalary: number
  hra: number
  da: number
  taxDeduction: number
  pfDeduction: number
  effectiveFrom: string
}

/**
 * Mutation hook to upsert salary structure.
 */
export function useUpsertSalaryStructure(): UseMutationResult<
  any,
  Error,
  UpsertSalaryStructureParams
> {
  return useMutation<any, Error, UpsertSalaryStructureParams>({
    mutationFn: async (params) => {
      const { data, error } = await upsertSalaryStructureAction(params)
      if (error) {
        throw new Error(error)
      }
      return data
    },
    onSuccess: () => {
      toast.success('Salary structure saved successfully.')
    },
    onError: (error) => {
      toast.error(`Failed to save salary structure: ${error.message}`)
    },
  })
}

interface UpdatePayslipStatusParams {
  payslipId: string
  status: 'Draft' | 'Processing' | 'Paid'
  employeeId?: string
}

/**
 * Mutation hook to update payslip status.
 */
export function useUpdatePayslipStatus(): UseMutationResult<
  any,
  Error,
  UpdatePayslipStatusParams
> {
  const queryClient = useQueryClient()

  return useMutation<any, Error, UpdatePayslipStatusParams>({
    mutationFn: async ({ payslipId, status }) => {
      const { data, error } = await updatePayslipStatusAction(payslipId, status)
      if (error) {
        throw new Error(error)
      }
      return data
    },
    onSuccess: (data, variables) => {
      toast.success(`Payslip marked as ${variables.status}.`)
      if (variables.employeeId) {
        queryClient.invalidateQueries({ queryKey: payrollKeys.history(variables.employeeId) })
      }
      queryClient.invalidateQueries({ queryKey: payrollKeys.history() })
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`)
    },
  })
}
