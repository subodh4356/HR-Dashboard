'use client';

import SectionHeader from '../ui/SectionHeader';
import DepartmentAttendanceChart from '@/components/analytics/DepartmentAttendanceChart';
import PieChartComponent from '../charts/PieChartComponent';
import SmallTable from '../ui/SmallTable';

const attendanceTrend = [
    { day: '1', present: 95 },
    { day: '2', present: 96 },
    { day: '3', present: 94 },
    { day: '4', present: 98 },
    { day: '5', present: 92 },
    { day: '6', present: 90 }, // Weekend maybe?
    { day: '7', present: 95 },
];

const leaveData = [
    { name: 'Sick Leave', value: 12, fill: '#ef4444' },
    { name: 'Casual Leave', value: 24, fill: '#f59e0b' },
    { name: 'Privilege Leave', value: 45, fill: '#3b82f6' },
    { name: 'Unpaid', value: 5, fill: '#64748b' },
];

const lateComers = [
    { name: 'John Doe', time: '10:15 AM', dept: 'Engineering' },
    { name: 'Sarah Smith', time: '10:05 AM', dept: 'Marketing' },
    { name: 'Mike Ross', time: '10:30 AM', dept: 'Legal' },
]

export default function AttendanceLeave() {
    return (
        <div className="mb-8">
            <SectionHeader title="Attendance & Leave" description="Monthly attendance trends and leave distribution" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <DepartmentAttendanceChart monthsBack={6} />
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Late Comers Today</h3>
                    <ul className="space-y-3">
                        {lateComers.map((p, i) => (
                            <li key={i} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium text-slate-700">{p.name}</p>
                                    <p className="text-xs text-slate-500">{p.dept}</p>
                                </div>
                                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">{p.time}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <PieChartComponent
                    title="Leave Type Breakup"
                    data={leaveData}
                    nameKey="name"
                    dataKey="value"
                />
            </div>
        </div>
    );
}
