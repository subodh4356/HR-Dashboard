'use client';

import SectionHeader from '../ui/SectionHeader';
import LineChartComponent from '../charts/LineChartComponent';
import BarChartComponent from '../charts/BarChartComponent';
import PieChartComponent from '../charts/PieChartComponent';

const attritionTrend = [
    { month: 'Jan', rate: 2.1 },
    { month: 'Feb', rate: 2.4 },
    { month: 'Mar', rate: 2.0 },
    { month: 'Apr', rate: 2.8 },
    { month: 'May', rate: 2.5 },
    { month: 'Jun', rate: 2.2 },
];

const deptAttrition = [
    { name: 'Sales', count: 5 },
    { name: 'Support', count: 3 },
    { name: 'Engineering', count: 2 },
    { name: 'HR', count: 1 },
];

const exitReasons = [
    { name: 'Better Opportunity', value: 45, fill: '#3b82f6' },
    { name: 'Higher Studies', value: 20, fill: '#10b981' },
    { name: 'Relocation', value: 15, fill: '#f59e0b' },
    { name: 'Personal', value: 20, fill: '#ef4444' },
];

export default function AttritionRetention() {
    return (
        <div className="mb-8">
            <SectionHeader title="Attrition & Retention" description="Tracking employee turnover and reasons" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent
                    title="Monthly Attrition Trend (%)"
                    data={attritionTrend}
                    xKey="month"
                    lines={[{ key: 'rate', color: '#ef4444', name: 'Attrition %' }]}
                />
                <BarChartComponent
                    title="Department-wise Attrition"
                    data={deptAttrition}
                    xKey="name"
                    yKey="count"
                    colors={['#f43f5e']}
                />
                <PieChartComponent
                    title="Reasons for Exit"
                    data={exitReasons}
                    nameKey="name"
                    dataKey="value"
                />
                {/* Placeholder for Length of Service Histogram - reusing BarChart for now */}
                <BarChartComponent
                    title="Length of Service Before Exit (Years)"
                    data={[
                        { range: '< 1 Yr', count: 4 },
                        { range: '1-3 Yrs', count: 12 },
                        { range: '3-5 Yrs', count: 5 },
                        { range: '> 5 Yrs', count: 2 },
                    ]}
                    xKey="range"
                    yKey="count"
                    colors={['#8b5cf6']}
                />
            </div>
        </div>
    );
}
