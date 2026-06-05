'use client';

import SectionHeader from '../ui/SectionHeader';
import SmallTable from '../ui/SmallTable';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const highPerformers = [
    { name: 'Alice Walker', role: 'Senior Dev', rating: '5.0' },
    { name: 'Bob Smith', role: 'Sales Manager', rating: '4.9' },
    { name: 'Charlie Brown', role: 'Designer', rating: '4.8' },
];

const lowPerformers = [
    { name: 'David Lee', role: 'Intern', rating: '2.1' },
    { name: 'Eva Green', role: 'Support', rating: '2.4' },
    { name: 'Frank White', role: 'Marketing', rating: '2.5' },
];

const ratingDist = [
    { name: 'Excellent', count: 15, color: '#10b981' }, // Green
    { name: 'Good', count: 45, color: '#3b82f6' }, // Blue
    { name: 'Average', count: 30, color: '#f59e0b' }, // Yellow
    { name: 'Poor', count: 10, color: '#ef4444' }, // Red
];

// Simple Gauge implementation
const GoalCompletionGauge = () => {
    const data = [
        { name: 'Completed', value: 75, fill: '#10b981' },
        { name: 'Remaining', value: 25, fill: '#e2e8f0' },
    ];
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-center items-center h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Goal Completion</h3>
            <div className="h-40 w-full relative">
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cy="70%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={180}
                            endAngle={0}
                            dataKey="value"
                        >
                            <Cell fill="#10b981" />
                            <Cell fill="#e2e8f0" />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 top-auto bottom-8 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800">75%</span>
                    <span className="text-xs text-slate-500">Overall Status</span>
                </div>
            </div>
        </div>
    );
}

export default function PerformanceOverview() {
    const columns = [
        { key: 'name', header: 'Name' },
        { key: 'role', header: 'Role' },
        {
            key: 'rating',
            header: 'Rating',
            render: (val: string) => <span className="font-bold text-slate-700">{val}</span>
        },
    ];

    return (
        <div className="mb-8">
            <SectionHeader title="Performance Overview" description="Employee ratings and goal tracking" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Rating Distribution Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Rating Distribution</h3>
                    <div className="flex gap-4 items-end justify-around h-40">
                        {ratingDist.map((item) => (
                            <div key={item.name} className="flex flex-col items-center gap-2 group w-full">
                                <div className="relative w-full bg-slate-100 rounded-t-lg overflow-hidden h-32 flex items-end justify-center">
                                    <div
                                        style={{ height: `${item.count}%`, backgroundColor: item.color }}
                                        className="w-12 rounded-t-lg transition-all duration-500 group-hover:opacity-90"
                                    ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-600">{item.name}</span>
                                <span className="text-xs text-slate-400">{item.count}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                <GoalCompletionGauge />

                <div className="lg:col-span-2">
                    <SmallTable
                        title="High Performers"
                        data={highPerformers}
                        columns={columns}
                        maxHeight="250px"
                    />
                </div>
                <div className="lg:col-span-2">
                    <SmallTable
                        title="Needs Improvement"
                        data={lowPerformers}
                        columns={columns}
                        maxHeight="250px"
                    />
                </div>
            </div>
        </div>
    );
}
