'use client';

import { cn } from '@/lib/utils';

export type Status = 'success' | 'warning' | 'error' | 'neutral';

interface StatusIndicatorProps {
    status: Status;
    text?: string;
    pulsate?: boolean;
}

export default function StatusIndicator({ status, text, pulsate = false }: StatusIndicatorProps) {
    const colors = {
        success: 'bg-emerald-500',
        warning: 'bg-amber-400',
        error: 'bg-rose-500',
        neutral: 'bg-slate-400',
    };

    const textColors = {
        success: 'text-emerald-700',
        warning: 'text-amber-700',
        error: 'text-rose-700',
        neutral: 'text-slate-600',
    };

    const bgColors = {
        success: 'bg-emerald-50',
        warning: 'bg-amber-50',
        error: 'bg-rose-50',
        neutral: 'bg-slate-50',
    };

    return (
        <div className={cn("inline-flex items-center gap-2 px-2.5 py-1 rounded-full", bgColors[status])}>
            <span className="relative flex h-2.5 w-2.5">
                {pulsate && (
                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[status])}></span>
                )}
                <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", colors[status])}></span>
            </span>
            {text && <span className={cn("text-xs font-medium", textColors[status])}>{text}</span>}
        </div>
    );
}
