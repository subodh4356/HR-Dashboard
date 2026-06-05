'use client';
 
import React, { useEffect, useState } from 'react';
import PageHeader from "@/components/PageHeader";
import TopStats from "@/components/dashboard/sections/TopStats";
import WorkforceOverview from "@/components/dashboard/sections/WorkforceOverview";
import RecruitmentStatus from "@/components/dashboard/sections/RecruitmentStatus";
import AttendanceLeave from "@/components/dashboard/sections/AttendanceLeave";
import PayrollSummary from "@/components/dashboard/sections/PayrollSummary";
import AttritionRetention from "@/components/dashboard/sections/AttritionRetention";
import PerformanceOverview from "@/components/dashboard/sections/PerformanceOverview";
import TrainingEngagement from "@/components/dashboard/sections/TrainingEngagement";
import ComplianceDocumentation from "@/components/dashboard/sections/ComplianceDocumentation";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, Calendar, Briefcase, Clock, CreditCard, Target, GraduationCap } from "lucide-react";
import Link from 'next/link';
 
import FounderOverview from "@/components/dashboard/sections/FounderOverview";
import { createClient } from '@/lib/supabaseClient';
import KpiCard from '@/components/KpiCard';
import CheckInOut from '@/components/CheckInOut';
import LeaveRequestForm from '@/components/LeaveRequestForm';

export default function DashboardPage() {
    const { role, loading, employeeId } = useUserRole();
    const [empData, setEmpData] = useState<any>(null);
    const [dashboardMetrics, setDashboardMetrics] = useState({
        presentDays: 0,
        workingDays: 22,
        approvedLeaves: 0,
        pendingLeaves: 0,
        latestPayslip: null as any,
        recentLeaves: [] as any[],
        recentGoals: [] as any[],
        recentEnrollments: [] as any[]
    });
    const [fetchingMetrics, setFetchingMetrics] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        if (role === 'employee' && employeeId) {
            const fetchEmployeeDashboard = async () => {
                setFetchingMetrics(true);
                try {
                    // 1. Fetch Employee Details
                    const { data: emp } = await supabase
                        .from('employee')
                        .select('*, department:department_id(name)')
                        .eq('id', employeeId)
                        .single();
                    if (emp) setEmpData(emp);

                    // 2. Fetch attendance logs for current month
                    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                    const { data: attendance } = await supabase
                        .from('attendance')
                        .select('date, status')
                        .eq('employee_id', employeeId)
                        .gte('date', startOfMonth);

                    const present = attendance?.filter(a => a.status?.toLowerCase() === 'present').length || 0;

                    // 3. Fetch leaves
                    const { data: leaves } = await supabase
                        .from('leave_request')
                        .select('*, leave_policy:leave_policy_id(name)')
                        .eq('employee_id', employeeId)
                        .order('created_at', { ascending: false });

                    const approved = leaves?.filter(l => l.status?.toLowerCase() === 'approved').length || 0;
                    const pending = leaves?.filter(l => l.status?.toLowerCase() === 'pending').length || 0;

                    // 4. Fetch latest payslip
                    const { data: payslip } = await supabase
                        .from('payslips')
                        .select('*')
                        .eq('employee_id', employeeId)
                        .order('pay_period_start', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    // 5. Fetch goals
                    const { data: goals } = await supabase
                        .from('performance_goal')
                        .select('*')
                        .eq('employee_id', employeeId)
                        .order('created_at', { ascending: false })
                        .limit(3);

                    // 6. Fetch training enrollments
                    const { data: enrollments } = await supabase
                        .from('training_enrollment')
                        .select('*, course:training_course(*)')
                        .eq('employee_id', employeeId)
                        .order('updated_at', { ascending: false })
                        .limit(3);

                    setDashboardMetrics({
                        presentDays: present,
                        workingDays: 22, // average standard working days
                        approvedLeaves: approved,
                        pendingLeaves: pending,
                        latestPayslip: payslip || null,
                        recentLeaves: leaves?.slice(0, 5) || [],
                        recentGoals: goals || [],
                        recentEnrollments: (enrollments as any[]) || []
                    });
                } catch (error) {
                    console.error("Error fetching employee dashboard metrics:", error);
                } finally {
                    setFetchingMetrics(false);
                }
            };
            fetchEmployeeDashboard();
        }
    }, [role, employeeId, supabase]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (role === 'employee') {
        const deptName = empData?.department?.name || 'Operations';

        return (
            <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back, {empData?.first_name || 'User'}!</h1>
                        <p className="text-slate-500 text-sm mt-1">{deptName} Department | Employee Portal Overview</p>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                        Last synced: {new Date().toLocaleTimeString()}
                    </div>
                </div>

                {fetchingMetrics ? (
                    <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="ml-3 text-slate-500 font-medium text-sm">Loading workspace dashboard...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left / Main Section (Stats & Actions) */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* KPI Metrics row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <KpiCard
                                    title="Attendance (This Month)"
                                    value={`${dashboardMetrics.presentDays} / ${dashboardMetrics.workingDays} Days`}
                                    icon={Calendar}
                                />
                                <KpiCard
                                    title="Leaves Approved"
                                    value={`${dashboardMetrics.approvedLeaves} Days`}
                                    icon={Briefcase}
                                />
                                <KpiCard
                                    title="Latest Net Pay"
                                    value={dashboardMetrics.latestPayslip ? `₹${dashboardMetrics.latestPayslip.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'No Pay Record'}
                                    icon={CreditCard}
                                />
                            </div>

                            {/* Check In / Out Widget */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                    Daily Attendance Punch
                                </h3>
                                <div className="max-w-md mx-auto">
                                    <CheckInOut />
                                </div>
                            </div>

                            {/* Recent Leave Requests Table */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900">Recent Leave Applications</h3>
                                    <Link href="/leave" className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                                        View All
                                    </Link>
                                </div>
                                {!dashboardMetrics.recentLeaves || dashboardMetrics.recentLeaves.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        No recent leave requests found.
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                                                    <th className="px-6 py-3">Type</th>
                                                    <th className="px-6 py-3">Dates</th>
                                                    <th className="px-6 py-3">Days</th>
                                                    <th className="px-6 py-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {dashboardMetrics.recentLeaves.map((leave) => {
                                                    const policyName = leave.leave_policy?.name || 'Leave';
                                                    return (
                                                        <tr key={leave.id} className="hover:bg-slate-50/30 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-slate-900">{policyName}</td>
                                                            <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                                                                {leave.start_date} to {leave.end_date}
                                                            </td>
                                                            <td className="px-6 py-4 text-slate-700">{leave.days} Days</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                                                                    leave.status?.toLowerCase() === 'approved'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                                        : leave.status?.toLowerCase() === 'rejected'
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                                }`}>
                                                                    {leave.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Section (Quick Action Forms) */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                                    <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                                    Quick Leave Application
                                </h3>
                                <LeaveRequestForm onSuccess={() => {
                                    // Refresh metrics after leave submission
                                    window.location.reload();
                                }} />
                            </div>

                            {/* Goals Widget */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                                        <Target className="w-5 h-5 mr-2 text-indigo-650" />
                                        My Active Goals
                                    </h3>
                                    <Link href="/performance" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
                                        View All
                                    </Link>
                                </div>
                                {dashboardMetrics.recentGoals.length === 0 ? (
                                    <p className="text-slate-400 text-xs py-2">No active goals configured.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {dashboardMetrics.recentGoals.map((goal: any) => (
                                            <div key={goal.id} className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium text-slate-700">
                                                    <span className="truncate max-w-[150px]">{goal.title}</span>
                                                    <span>{goal.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-indigo-650 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${goal.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Training Widget */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-base font-bold text-slate-900 flex items-center">
                                        <GraduationCap className="w-5 h-5 mr-2 text-emerald-650" />
                                        My Learning Progress
                                    </h3>
                                    <Link href="/training" className="text-xs font-semibold text-emerald-650 hover:text-emerald-500 transition-colors">
                                        View Track
                                    </Link>
                                </div>
                                {dashboardMetrics.recentEnrollments.length === 0 ? (
                                    <p className="text-slate-400 text-xs py-2">Not enrolled in any courses.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {dashboardMetrics.recentEnrollments.map((enroll: any) => (
                                            <div key={enroll.id} className="space-y-1">
                                                <div className="flex justify-between text-xs font-medium text-slate-700">
                                                    <span className="truncate max-w-[150px]">{enroll.course?.title}</span>
                                                    <span className="text-[10px] font-bold text-slate-450 uppercase">{enroll.status}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${enroll.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (role !== 'admin' && role !== 'hr') {
        return null;
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="HR Executive Dashboard"
                description="Comprehensive overview of workforce metrics and KPIs"
            />

            {/* Founder / CEO Level Overview */}
            <FounderOverview />

            {/* Standard Metrics */}
            {/* <TopStats />  -- Commenting out TopStats as FounderOverview covers key metrics */}

            {/* Sections Grid - Using a single logic flow where sections stack vertically, 
          but internally they have grids. We separate them with spacing. */}

            <div className="space-y-12">
                <WorkforceOverview />
                <div className="w-full h-px bg-slate-200" /> {/* Divider */}

                <RecruitmentStatus />
                <div className="w-full h-px bg-slate-200" />

                <AttendanceLeave />
                <div className="w-full h-px bg-slate-200" />

                <PayrollSummary />
                <div className="w-full h-px bg-slate-200" />

                <AttritionRetention />
                <div className="w-full h-px bg-slate-200" />

                <PerformanceOverview />
                <div className="w-full h-px bg-slate-200" />

                <TrainingEngagement />
                <div className="w-full h-px bg-slate-200" />

                <ComplianceDocumentation />
            </div>

        </div>
    );
}
