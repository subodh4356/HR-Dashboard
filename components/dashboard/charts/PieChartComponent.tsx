'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PieChartProps {
    data: any[];
    nameKey: string;
    dataKey: string;
    colors?: string[];
    height?: number;
    title?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }} />
                    <span className="text-sm font-medium text-slate-700">{payload[0].name}</span>
                </div>
                <p className="text-lg font-bold text-slate-800 mt-1">
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

export default function PieChartComponent({
    data,
    nameKey,
    dataKey,
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    height = 300,
    title,
}: PieChartProps) {
    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
            {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
            <div style={{ width: '100%', height: height, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            dataKey={dataKey}
                            nameKey={nameKey}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                const RADIAN = Math.PI / 180;
                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
                                        {`${(percent * 100).toFixed(0)}%`}
                                    </text>
                                );
                            }}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="white" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            iconType="circle"
                            formatter={(value) => <span className="text-slate-600 text-sm ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
