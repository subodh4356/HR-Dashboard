'use client';

import SectionHeader from '../ui/SectionHeader';
import LineChartComponent from '../charts/LineChartComponent';
import BarChartComponent from '../charts/BarChartComponent';
import SmallTable from '../ui/SmallTable';

const payoutTrend = [
    { month: 'Jan', amount: 400000 },
    { month: 'Feb', amount: 410000 },
    { month: 'Mar', amount: 405000 },
    { month: 'Apr', amount: 420000 },
    { month: 'May', amount: 415000 },
    { month: 'Jun', amount: 430000 },
];

const salaryDist = [
    { name: 'Engineering', value: 180000 },
    { name: 'Sales', value: 120000 },
    { name: 'Marketing', value: 80000 },
    { name: 'Finance', value: 60000 },
];

const deductions = [
    { type: 'PF', amount: '₹12,400', status: 'Proceeding' },
    { type: 'Tax', amount: '₹45,000', status: 'Pending' },
    { type: 'Insurance', amount: '₹8,200', status: 'Completed' },
];

export default function PayrollSummary() {
    return (
        <div className="mb-8">
            <SectionHeader title="Payroll Summary" description="Salary trends and departmental breakdown" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <LineChartComponent
                        title="Monthly Payout Trend"
                        data={payoutTrend}
                        xKey="month"
                        lines={[{ key: 'amount', color: '#8b5cf6', name: 'Total Payout' }]}
                    />
                </div>
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">Deduction Summary</h3>
                        <ul className="space-y-3">
                            {deductions.map((d, i) => (
                                <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="font-medium text-slate-700">{d.type}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-slate-800">{d.amount}</div>
                                        <div className="text-xs text-slate-500">{d.status}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="lg:col-span-3">
                    <BarChartComponent
                        title="Salary Distribution by Department"
                        data={salaryDist}
                        xKey="name"
                        yKey="value"
                        colors={['#f59e0b']}
                    />
                </div>
            </div>
        </div>
    );
}
