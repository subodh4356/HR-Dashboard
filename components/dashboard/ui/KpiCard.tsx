'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: string; // e.g. "+5%"
    trendUp?: boolean; // true = green, false = red
    subtext?: string;
    color?: string; // border-l color
}

export default function KpiCard({ title, value, icon: Icon, trend, trendUp, subtext, color = 'blue' }: KpiCardProps) {
    const colorClasses: Record<string, string> = {
        blue: 'border-l-blue-500 bg-blue-50/30 text-blue-600',
        green: 'border-l-emerald-500 bg-emerald-50/30 text-emerald-600',
        red: 'border-l-rose-500 bg-rose-50/30 text-rose-600',
        purple: 'border-l-violet-500 bg-violet-50/30 text-violet-600',
        orange: 'border-l-amber-500 bg-amber-50/30 text-amber-600',
    };

    const iconColorClass = colorClasses[color] || colorClasses.blue;

    return (
        <div className={`relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 overflow-hidden group`}>
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-emerald-500' : color === 'red' ? 'bg-rose-500' : color === 'purple' ? 'bg-violet-500' : 'bg-amber-500'}`}></div>
            <div className="flex items-start justify-between mb-2 pl-3">
                <h3 className="text-sm font-medium text-slate-500 truncate pr-2">{title}</h3>
                {Icon && (
                    <div className={cn("p-2 rounded-lg", iconColorClass)}>
                        <Icon size={18} strokeWidth={2.5} />
                    </div>
                )}
            </div>
            <div className="pl-3">
                <div className="text-3xl font-bold text-slate-800 tracking-tight">
                    {value}
                </div>
                {(trend || subtext) && (
                    <div className="flex items-center mt-2 gap-2 text-xs">
                        {trend && (
                            <span className={cn(
                                "font-semibold px-1.5 py-0.5 rounded",
                                trendUp ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
                            )}>
                                {trend}
                            </span>
                        )}
                        {subtext && <span className="text-slate-400">{subtext}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
