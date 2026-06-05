'use client'

import { useDepartmentAttendanceTrend } from '@/lib/hooks/use-analytics'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/analytics/ErrorBoundary'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function DepartmentAttendanceChartInner({ monthsBack = 6 }: { monthsBack?: number }) {
  const { data, isLoading, isError, error } = useDepartmentAttendanceTrend(monthsBack)

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
        <p className="text-sm">Failed to load attendance trends: {error?.message || 'Data error'}</p>
      </div>
    )
  }

  // Pivot data for Recharts: Group by month and map departments to rates
  const departments = Array.from(new Set(data.map((item) => item.department)))
  const pivotedData = Object.values(
    data.reduce((acc, item) => {
      if (!acc[item.month]) {
        acc[item.month] = { month: item.month }
      }
      acc[item.month][item.department] = item.attendance_rate
      return acc
    }, {} as Record<string, any>)
  ).sort((a: any, b: any) => a.month.localeCompare(b.month))

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Attendance Trends by Department</h3>
        <p className="text-xs text-slate-500">Monthly attendance rates (%) across active departments</p>
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pivotedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            {departments.map((dept, index) => (
              <Line
                key={dept}
                type="monotone"
                dataKey={dept}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4, strokeWidth: 1 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function DepartmentAttendanceChart({ monthsBack = 6 }: { monthsBack?: number }) {
  return (
    <ErrorBoundary>
      <DepartmentAttendanceChartInner monthsBack={monthsBack} />
    </ErrorBoundary>
  )
}
