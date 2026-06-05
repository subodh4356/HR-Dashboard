'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2 } from 'lucide-react'
import { PayslipWithRelation } from '@/app/actions/payroll'
import { createClient } from '@/lib/supabaseClient'

interface PayslipExportProps {
  payslip: PayslipWithRelation
}

export default function PayslipExport({ payslip }: PayslipExportProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Dynamically import jsPDF and autoTable for performance optimization
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const status = payslip.status.toUpperCase()

      // 1. Watermark Stamp (rotated light gray text in the background)
      doc.setTextColor(245, 247, 250)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(65)
      doc.text(status, 45, 175, { angle: 35 })

      // Decorative top bar (accent line)
      doc.setFillColor(79, 70, 229) // Indigo-600
      doc.rect(14, 10, 182, 2, 'F')

      // 2. Company Header
      let companyName = 'HR PORTAL ENTERPRISE'
      let companyAddress = '123 Corporate Boulevard, Suite 500'
      let companyContact = 'Contact: hr@yourcompany.com | +1 (555) 019-9000'

      try {
        const supabaseClient = createClient()
        const { data: settingsData } = await supabaseClient
          .from('system_settings')
          .select('*')
        
        if (settingsData) {
          settingsData.forEach(setting => {
            if (setting.key === 'COMPANY_NAME') companyName = setting.value
            if (setting.key === 'COMPANY_ADDRESS') companyAddress = setting.value
            if (setting.key === 'COMPANY_CONTACT') companyContact = setting.value
          })
        }
      } catch (e) {
        console.error("Error reading system settings for payslip:", e)
      }

      doc.setTextColor(15, 23, 42) // Slate-900
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(companyName, 14, 22)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 116, 139) // Slate-500
      doc.text(companyAddress, 14, 27)
      doc.text(companyContact, 14, 31)

      // Document Title on the right side
      doc.setTextColor(79, 70, 229) // Indigo-600
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('PAYSLIP RECEIPT', 196, 22, { align: 'right' })

      doc.setDrawColor(226, 232, 240) // Slate-200
      doc.setLineWidth(0.4)
      doc.line(14, 34, 196, 34)

      // 3. Document Details Section
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.setFontSize(9)
      
      // Details Columns Grid - Left Column
      doc.setFont('helvetica', 'bold')
      doc.text('Employee Name:', 14, 43)
      doc.setFont('helvetica', 'normal')
      const fullName = payslip.employee
        ? `${payslip.employee.first_name} ${payslip.employee.last_name}`
        : 'N/A'
      doc.text(fullName, 46, 43)

      doc.setFont('helvetica', 'bold')
      doc.text('Employee ID:', 14, 48)
      doc.setFont('helvetica', 'normal')
      doc.text(payslip.employee_id, 46, 48)

      // Details Columns Grid - Right Column
      doc.setFont('helvetica', 'bold')
      doc.text('Pay Period:', 110, 43)
      doc.setFont('helvetica', 'normal')
      doc.text(`${payslip.pay_period_start} to ${payslip.pay_period_end}`, 142, 43)

      doc.setFont('helvetica', 'bold')
      doc.text('Payout Status:', 110, 48)
      
      // Dynamic Status Styling
      if (payslip.status === 'Paid') {
        doc.setTextColor(16, 185, 129) // Emerald-600
        doc.setFont('helvetica', 'bold')
      } else if (payslip.status === 'Processing') {
        doc.setTextColor(245, 158, 11) // Amber-500
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setTextColor(100, 116, 139) // Slate-500
        doc.setFont('helvetica', 'normal')
      }
      doc.text(status, 142, 48)
      doc.setTextColor(15, 23, 42) // Reset

      // Attendance Metrics Section
      doc.setDrawColor(241, 245, 249) // Slate-100
      doc.setFillColor(248, 250, 252) // Slate-50
      doc.rect(14, 55, 182, 14, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139) // Slate-500
      doc.text('WORKING DAYS', 22, 60)
      doc.text('PRESENT DAYS', 82, 60)
      doc.text('UNPAID LEAVES', 142, 60)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.text(payslip.working_days.toString(), 22, 66)
      doc.text(payslip.present_days.toString(), 82, 66)
      doc.text(payslip.unpaid_leave_days.toString(), 142, 66)

      // 4. Itemized Earnings & Deductions Tables (INR Currency)
      const earnings = [
        ['Basic Salary Component', `INR ${Number(payslip.salary_structure?.base_salary || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['House Rent Allowance (HRA)', `INR ${Number(payslip.salary_structure?.hra || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Dearness Allowance (DA)', `INR ${Number(payslip.salary_structure?.da || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
      ]

      const deductions = [
        ['Statutory Tax Deduction', `INR ${Number(payslip.salary_structure?.tax_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Provident Fund (PF) Contribution', `INR ${Number(payslip.salary_structure?.pf_deduction || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
      ]

      // Earnings Table Execution
      autoTable(doc, {
        startY: 75,
        head: [['Earnings Component', 'Amount']],
        body: earnings,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' }, // Indigo-600
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right' } }, // Right align amount column
        margin: { left: 14, right: 14 },
      })

      const earningsEnd = (doc as any).lastAutoTable.finalY

      // Deductions Table Execution
      autoTable(doc, {
        startY: earningsEnd + 6,
        head: [['Deductions Component', 'Amount']],
        body: deductions,
        theme: 'striped',
        headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontStyle: 'bold' }, // Rose-600
        styles: { fontSize: 8.5, cellPadding: 3 },
        columnStyles: { 1: { halign: 'right' } }, // Right align amount column
        margin: { left: 14, right: 14 },
      })

      const deductionsEnd = (doc as any).lastAutoTable.finalY

      // 5. Total Net Pay Summary Panel
      doc.setDrawColor(226, 232, 240) // Slate-200
      doc.setLineWidth(0.4)
      doc.setFillColor(248, 250, 252) // Slate-50 background
      doc.rect(14, deductionsEnd + 6, 182, 20, 'DF')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139) // Slate-500
      doc.text('GROSS EARNINGS', 22, deductionsEnd + 11)
      doc.text('TOTAL DEDUCTIONS', 78, deductionsEnd + 11)
      doc.setTextColor(79, 70, 229) // Indigo-600
      doc.text('NET TAKE-HOME PAY', 138, deductionsEnd + 11)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10.5)
      doc.setTextColor(15, 23, 42) // Slate-900
      doc.text(`INR ${Number(payslip.gross_pay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 22, deductionsEnd + 18)
      doc.text(`INR ${Number(payslip.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 78, deductionsEnd + 18)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(79, 70, 229) // Indigo-600
      doc.text(`INR ${Number(payslip.net_pay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 138, deductionsEnd + 18)

      // Footer disclaimer
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184) // Slate-400
      doc.text(
        'This is a system-generated secure payslip. No physical signature is required.',
        14,
        deductionsEnd + 35
      )

      // Trigger download
      doc.save(`payslip-${payslip.employee_id}-${payslip.pay_period_start}.pdf`)
      toast.success('Payslip exported to PDF.')
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error('Failed to generate PDF payslip.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-slate-500" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2 text-slate-500" />
          Download PDF
        </>
      )}
    </button>
  )
}
