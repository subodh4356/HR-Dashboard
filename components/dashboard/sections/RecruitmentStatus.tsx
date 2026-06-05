'use client';

import SectionHeader from '../ui/SectionHeader';
import BarChartComponent from '../charts/BarChartComponent';
import RecruitmentFunnelChart from '@/components/analytics/RecruitmentFunnelChart';

const sourceData = [
    { name: 'LinkedIn', count: 45 },
    { name: 'Referral', count: 30 },
    { name: 'Agency', count: 15 },
    { name: 'Website', count: 10 },
];

export default function RecruitmentStatus() {
    return (
        <div className="mb-8">
            <SectionHeader title="Recruitment Status" description="Tracking open positions and hiring pipeline" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecruitmentFunnelChart />
                <BarChartComponent
                    title="Hiring Source Performance"
                    data={sourceData}
                    xKey="name"
                    yKey="count"
                    colors={['#8b5cf6']}
                />
                {/* Additional metrics could go here as small cards or another chart */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                        <h4 className="text-slate-500 font-medium">Offer Acceptance Rate</h4>
                        <div className="text-4xl font-bold text-emerald-600 mt-2">78%</div>
                        <p className="text-emerald-600 text-sm mt-1">+2% vs last month</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center">
                        <h4 className="text-slate-500 font-medium">Time to Fill</h4>
                        <div className="text-4xl font-bold text-blue-600 mt-2">24 Days</div>
                        <p className="text-blue-600 text-sm mt-1">-3 days (Faster)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
