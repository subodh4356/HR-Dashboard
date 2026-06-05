'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'
import { useUserRole } from '@/hooks/useUserRole'
import { createClient } from '@/lib/supabaseClient'
import { Loader2, Plus, Calendar, IndianRupee, FileText, CheckCircle, ShieldAlert } from 'lucide-react'
import {
  usePayslipHistory,
  useGeneratePayslip,
  useUpsertSalaryStructure,
  useUpdatePayslipStatus,
} from '@/lib/hooks/use-payroll'
import PayslipExport from '@/components/payroll/PayslipExport'

export default function PayrollPage() {
  const { role, loading: roleLoading, employeeId } = useUserRole()
  const isAdminOrHr = role === 'admin' || role === 'hr'

  const [activeTab, setActiveTab] = useState<'history' | 'structures'>( 'history')
  const [employees, setEmployees] = useState<any[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(false)

  // Form states for generating payslip
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')

  // Form states for salary structure
  const [structEmployeeId, setStructEmployeeId] = useState('')
  const [baseSalary, setBaseSalary] = useState('')
  const [hra, setHra] = useState('')
  const [da, setDa] = useState('')
  const [taxDeduction, setTaxDeduction] = useState('')
  const [pfDeduction, setPfDeduction] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [showStructForm, setShowStructForm] = useState(false)

  const supabase = createClient()

  // Queries & Mutations hooks
  const { data: payslips, isLoading: payslipsLoading, refetch: refetchPayslips } = usePayslipHistory(
    isAdminOrHr ? undefined : (employeeId || undefined)
  )

  const generatePayslipMutation = useGeneratePayslip()
  const upsertSalaryStructureMutation = useUpsertSalaryStructure()
  const updatePayslipStatusMutation = useUpdatePayslipStatus()

  // Fetch employees list for Admin/HR
  useEffect(() => {
    if (isAdminOrHr) {
      const fetchEmployees = async () => {
        setEmployeesLoading(true)
        const { data, error } = await supabase
          .from('employee')
          .select('id, first_name, last_name, email, employee_code')
          .order('first_name', { ascending: true })

        if (error) {
          console.error('Error fetching employees:', error.message)
        } else {
          setEmployees(data || [])
        }
        setEmployeesLoading(false)
      }
      fetchEmployees()
    }
  }, [isAdminOrHr, supabase])

  const handleGeneratePayslip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId || !selectedMonth) {
      alert('Please select an employee and a month.')
      return
    }

    // Format selectedMonth (YYYY-MM) to first day of month (YYYY-MM-01) for RPC
    const payPeriodStart = `${selectedMonth}-01`

    generatePayslipMutation.mutate(
      { employeeId: selectedEmployeeId, payPeriodStart },
      {
        onSuccess: () => {
          setSelectedEmployeeId('')
          setSelectedMonth('')
        },
      }
    )
  }

  const handleSaveSalaryStructure = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!structEmployeeId || !baseSalary || !effectiveFrom) {
      alert('Please fill out employee, base salary, and effective from date.')
      return
    }

    upsertSalaryStructureMutation.mutate(
      {
        employeeId: structEmployeeId,
        baseSalary: Number(baseSalary),
        hra: Number(hra || 0),
        da: Number(da || 0),
        taxDeduction: Number(taxDeduction || 0),
        pfDeduction: Number(pfDeduction || 0),
        effectiveFrom: effectiveFrom,
      },
      {
        onSuccess: () => {
          setStructEmployeeId('')
          setBaseSalary('')
          setHra('')
          setDa('')
          setTaxDeduction('')
          setPfDeduction('')
          setEffectiveFrom('')
          setShowStructForm(false)
        },
      }
    )
  }

  const handleStatusChange = (payslipId: string, empId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Draft' ? 'Processing' : currentStatus === 'Processing' ? 'Paid' : 'Draft'
    updatePayslipStatusMutation.mutate({
      payslipId,
      status: nextStatus as 'Draft' | 'Processing' | 'Paid',
      employeeId: empId,
    })
  }

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <PageHeader title="Payroll & Payslips" description="Manage salary structures, generate monthly payslips, and download secure receipt files." />

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Payslip Payout History
        </button>
        {isAdminOrHr && (
          <button
            onClick={() => setActiveTab('structures')}
            className={`pb-3 text-sm font-semibold border-b-2 px-4 transition-colors ${
              activeTab === 'structures'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Manage Salary Structures
          </button>
        )}
      </div>

      {activeTab === 'history' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* History Records Panel */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900">Payslip Records</h3>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-200 text-slate-700">
                  {payslips?.length || 0} Total
                </span>
              </div>

              {payslipsLoading ? (
                <div className="p-12 flex justify-center items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : !payslips || payslips.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-medium">No generated payslips found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-3">Employee</th>
                        <th className="px-6 py-3">Pay Period</th>
                        <th className="px-6 py-3">Working / Present</th>
                        <th className="px-6 py-3">Net Take-Home</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Receipt Export</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {payslips.map((slip) => {
                        const name = slip.employee ? `${slip.employee.first_name} ${slip.employee.last_name}` : 'N/A'
                        return (
                          <tr key={slip.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-900">{name}</p>
                              <p className="text-xs text-slate-500">{slip.employee?.email || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                              {slip.pay_period_start} to {slip.pay_period_end}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-700">
                              {slip.working_days} Days / {slip.present_days} Days
                              {slip.unpaid_leave_days > 0 && (
                                <span className="block text-red-500 font-semibold mt-0.5">
                                  ({slip.unpaid_leave_days} Unpaid)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              ₹{slip.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4">
                              {isAdminOrHr ? (
                                <button
                                  onClick={() => handleStatusChange(slip.id, slip.employee_id, slip.status)}
                                  disabled={updatePayslipStatusMutation.isPending}
                                  className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                    slip.status === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : slip.status === 'Processing'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {slip.status}
                                </button>
                              ) : (
                                <span
                                  className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                                    slip.status === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                      : slip.status === 'Processing'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  {slip.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <PayslipExport payslip={slip} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Panel (Admin Only) */}
          <div className="xl:col-span-1 space-y-6">
            {isAdminOrHr ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Generate Monthly Payslip
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Calculate business days worked, extract unpaid leaves, and generate draft payroll logs.
                  </p>
                </div>

                <form onSubmit={handleGeneratePayslip} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Employee</label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      disabled={employeesLoading}
                      className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_code || 'No Code'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Pay Period Month</label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={generatePayslipMutation.isPending}
                    className="w-full inline-flex justify-center items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 transition-colors"
                  >
                    {generatePayslipMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Run Payout Audit
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 space-y-3">
                <h4 className="font-semibold text-slate-800 flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                  Self-Service Portal Active
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your payslips are automatically calculated and logged monthly. Click **"Download PDF"** to export your secure payroll receipt. For adjustments, please contact HR Operations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'structures' && isAdminOrHr && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Compensation Profiles</h3>
              <p className="text-xs text-slate-500">Add or adjust Base monthly rates and tax/PF deductions.</p>
            </div>
            <button
              onClick={() => setShowStructForm(!showStructForm)}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Setup Salary Profile
            </button>
          </div>

          {/* New Structure Form Dropdown */}
          {showStructForm && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 animate-in slide-in-from-top duration-300">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center">
                <IndianRupee className="w-5 h-5 mr-2 text-blue-600" />
                Configure Salary Profile
              </h4>
              <form onSubmit={handleSaveSalaryStructure} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Employee</label>
                  <select
                    value={structEmployeeId}
                    onChange={(e) => setStructEmployeeId(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white focus:border-blue-600 focus:ring-1"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code || 'No Code'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Monthly Base Salary (₹)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    placeholder="5000"
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">House Rent Allowance (HRA) (₹)</label>
                  <input
                    type="number"
                    value={hra}
                    onChange={(e) => setHra(e.target.value)}
                    placeholder="500"
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Dearness Allowance (DA) (₹)</label>
                  <input
                    type="number"
                    value={da}
                    onChange={(e) => setDa(e.target.value)}
                    placeholder="200"
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Tax Deduction (₹)</label>
                  <input
                    type="number"
                    value={taxDeduction}
                    onChange={(e) => setTaxDeduction(e.target.value)}
                    placeholder="300"
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">PF / Pension Deduction (₹)</label>
                  <input
                    type="number"
                    value={pfDeduction}
                    onChange={(e) => setPfDeduction(e.target.value)}
                    placeholder="150"
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Effective From Date</label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 p-2.5 text-sm"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStructForm(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={upsertSalaryStructureMutation.isPending}
                    className="inline-flex justify-center items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 focus:outline-none disabled:opacity-60 transition-colors"
                  >
                    {upsertSalaryStructureMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Salary Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Simple Informational Warning for Setup */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-6 flex items-start space-x-3 text-amber-900 text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-amber-800">Note on Salary Adjustments</h5>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                Adding a new salary structure configuration overrides any older profiles beginning on the "Effective From Date". When running payouts, the system extracts the latest structure active on or before that pay month.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
