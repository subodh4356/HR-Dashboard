'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
    data: any[];
    xKey: string;
    lines: { key: string; color: string; name: string }[];
    height?: number;
    title?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl shadow-lg">
                <p className="font-semibold text-slate-700 mb-2">{label}</p>
                {payload.map((p: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-xs text-slate-500 capitalize">{p.name}:</span>
                        <span className="text-sm font-medium text-slate-700">{p.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function LineChartComponent({
    data,
    xKey,
    lines,
    height = 300,
    title,
}: LineChartProps) {
    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full">
            {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
            <div style={{ width: '100%', height: height, minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        <Tooltip content={<CustomTooltip />} />
                        {lines.map((line) => (
                            <Line
                                key={line.key}
                                type="monotone"
                                dataKey={line.key}
                                name={line.name}
                                stroke={line.color}
                                strokeWidth={3}
                                dot={{ fill: line.color, strokeWidth: 2, r: 4, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
