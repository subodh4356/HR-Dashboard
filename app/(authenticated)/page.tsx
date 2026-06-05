'use client';

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
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
    const { role, loading } = useUserRole();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (role === 'employee') {
        return (
            <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
                <PageHeader
                    title="Employee Dashboard"
                    description="Welcome to your employee portal"
                />
                <div className="p-8 bg-white rounded-lg shadow-sm border border-slate-200">
                    <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
                    <p className="text-slate-600">
                        Please use the sidebar to navigate to your profile, leave requests, or other available sections.
                    </p>
                </div>
            </div>
        );
    }

    if (role !== 'admin' && role !== 'hr') {
        return null; // Or a customized unauthorized view
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="HR Executive Dashboard"
                description="Comprehensive overview of workforce metrics and KPIs"
            />

            {/* Top Key Numbers */}
            <TopStats />

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
