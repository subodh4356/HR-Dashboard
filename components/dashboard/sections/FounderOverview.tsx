'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { ShieldCheck, AlertTriangle, Users, CheckCircle, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface DashboardMetrics {
    totalEmployees: number;
    pendingTasks: number;
    complianceOverdue: number;
    compliancePending: number;
    healthScore: number;
}

export default function FounderOverview() {
    const supabase = createClient();
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        totalEmployees: 0,
        pendingTasks: 0,
        complianceOverdue: 0,
        compliancePending: 0,
        healthScore: 100,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            setLoading(true);
            try {
                // 1. Employees
                const { count: empCount, error: empError } = await supabase
                    .from('employee')
                    .select('*', { count: 'exact', head: true });

                // 2. Pending Tasks (High Priority)
                const { count: taskCount, error: taskError } = await supabase
                    .from('hr_tasks')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Pending');

                // 3. Compliance
                const { data: complianceData, error: compError } = await supabase
                    .from('compliance_records')
                    .select('status');

                let overdue = 0;
                let pending = 0;

                if (complianceData) {
                    overdue = complianceData.filter(c => c.status === 'Overdue' || c.status === 'Non-Compliant').length;
                    pending = complianceData.filter(c => c.status === 'Pending').length;
                }

                // Calculate Health Score (Simple Logic)
                // Start 100. Deduct 10 for each Overdue. Deduct 2 for each Pending Task (High).
                // This is arbitrary for MVP.
                let score = 100;
                score -= (overdue * 10);
                if (score < 0) score = 0;

                setMetrics({
                    totalEmployees: empCount || 0,
                    pendingTasks: taskCount || 0,
                    complianceOverdue: overdue,
                    compliancePending: pending,
                    healthScore: score,
                });

            } catch (error) {
                console.error("Error fetching dashboard metrics", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return <div className="h-48 flex items-center justify-center bg-white rounded-xl border animate-pulse">
            <Loader2 className="animate-spin text-gray-400" />
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Health Score */}
                <div className={cn(
                    "p-6 rounded-xl border shadow-sm flex flex-col justify-between",
                    metrics.healthScore >= 80 ? "bg-emerald-50 border-emerald-100" :
                        metrics.healthScore >= 50 ? "bg-amber-50 border-amber-100" : "bg-red-50 border-red-100"
                )}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium opacity-80 mb-1">HR Health Score</p>
                            <h3 className={cn("text-3xl font-bold",
                                metrics.healthScore >= 80 ? "text-emerald-700" :
                                    metrics.healthScore >= 50 ? "text-amber-700" : "text-red-700"
                            )}>{metrics.healthScore}%</h3>
                        </div>
                        <Activity className={cn("w-8 h-8 opacity-50",
                            metrics.healthScore >= 80 ? "text-emerald-600" :
                                metrics.healthScore >= 50 ? "text-amber-600" : "text-red-600"
                        )} />
                    </div>
                    <div className="mt-4 text-xs opacity-70">
                        {metrics.healthScore >= 80 ? "Excellent Compliance" :
                            metrics.healthScore >= 50 ? "Needs Attention" : "Critical Risks Detected"}
                    </div>
                </div>

                {/* Compliance Risks */}
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Compliance Risks</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.complianceOverdue}</h3>
                        </div>
                        <ShieldCheck className={cn("w-8 h-8 opacity-50", metrics.complianceOverdue > 0 ? "text-red-500" : "text-green-500")} />
                    </div>
                    <Link href="/compliance" className="mt-4 text-xs text-blue-600 hover:underline flex items-center gap-1">
                        View Compliance Tracker {metrics.compliancePending > 0 && `(${metrics.compliancePending} pending)`}
                    </Link>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Pending HR Tasks</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.pendingTasks}</h3>
                        </div>
                        <CheckCircle className="w-8 h-8 opacity-50 text-blue-500" />
                    </div>
                    <Link href="/tasks" className="mt-4 text-xs text-blue-600 hover:underline">
                        Go to Task Manager
                    </Link>
                </div>

                {/* Total Headcount */}
                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Headcount</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.totalEmployees}</h3>
                        </div>
                        <Users className="w-8 h-8 opacity-50 text-purple-500" />
                    </div>
                    <Link href="/employees" className="mt-4 text-xs text-blue-600 hover:underline">
                        View Employee Directory
                    </Link>
                </div>

            </div>

            {/* Quick Alert Banner if Risk High */}
            {metrics.complianceOverdue > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0 w-5 h-5 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-red-800">Compliance Action Required</h4>
                        <p className="text-sm text-red-700 mt-1">
                            You have {metrics.complianceOverdue} overdue compliance items. Failure to address these may result in penalties.
                        </p>
                        <Link href="/compliance" className="text-sm text-red-900 font-medium underline mt-2 inline-block">
                            Resolve Now
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
