'use client'

import { useRecruitmentFunnelCounts } from '@/lib/hooks/use-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/analytics/ErrorBoundary'
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const STAGE_ORDER: Record<string, number> = {
  'Applied': 0,
  'Screened': 1,
  'Interviewed': 2,
  'Offered': 3,
  'Hired': 4,
}

function RecruitmentFunnelChartInner() {
  const { data, isLoading, isError, error } = useRecruitmentFunnelCounts()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-[350px] border border-dashed rounded-lg border-red-100 bg-red-50 text-red-900">
        <p className="text-sm">Failed to load recruitment funnel: {error?.message || 'Data error'}</p>
      </div>
    )
  }

  // Map and sort funnel stages logically
  const formattedData = data
    .filter((item) => item.stage.toLowerCase() !== 'rejected') // Exclude rejected candidates from funnel representation
    .sort((a, b) => {
      const orderA = STAGE_ORDER[a.stage] ?? 99
      const orderB = STAGE_ORDER[b.stage] ?? 99
      return orderA - orderB
    })
    .map((item, index) => ({
      name: item.stage,
      value: item.count,
      fill: COLORS[index % COLORS.length],
    }))

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Recruitment Pipeline Funnel</h3>
        <p className="text-xs text-slate-500">Active candidates count by interview stage</p>
      </div>
      <div className="h-[300px] w-full">
        {formattedData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No active candidates in the recruitment pipeline.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                itemStyle={{ color: '#1e293b' }}
              />
              <Funnel
                dataKey="value"
                data={formattedData}
                isAnimationActive
              >
                <LabelList
                  position="right"
                  dataKey="name"
                  fill="#64748b"
                  stroke="none"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                />
                <LabelList
                  position="center"
                  dataKey="value"
                  fill="#ffffff"
                  stroke="none"
                  style={{ fontSize: '14px', fontWeight: 'bold' }}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default function RecruitmentFunnelChart() {
  return (
    <ErrorBoundary>
      <RecruitmentFunnelChartInner />
    </ErrorBoundary>
  )
}
