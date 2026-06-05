'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';

interface BarChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    colors?: string[];
    height?: number;
    title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg">
                <p className="font-semibold text-slate-700 mb-1">{label}</p>
                <p className="text-sm text-blue-600 font-medium">
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

export default function BarChartComponent({
    data,
    xKey,
    yKey,
    colors = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
    height = 300,
    title,
}: BarChartProps) {
    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
            {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
            <div style={{ width: '100%', height: height, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                            dataKey={xKey}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                        <Bar dataKey={yKey} radius={[6, 6, 0, 0]} maxBarSize={50}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
