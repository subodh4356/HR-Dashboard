'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabaseClient';
import { useUserRole } from '@/hooks/useUserRole';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import { 
    Target, 
    TrendingUp, 
    Plus, 
    Award, 
    Search, 
    Calendar, 
    Edit3, 
    CheckCircle2, 
    AlertCircle, 
    Trash2, 
    User, 
    UserCheck, 
    ChevronRight,
    Star,
    Loader2,
    Sliders,
    ClipboardCopy
} from 'lucide-react';

interface ReviewCycle {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'Draft' | 'Active' | 'Completed';
    created_at: string;
}

interface PerformanceReview {
    id: string;
    cycle_id: string;
    employee_id: string;
    reviewer_id: string | null;
    self_rating: number | null;
    self_feedback: string | null;
    manager_rating: number | null;
    manager_feedback: string | null;
    hr_feedback: string | null;
    status: 'Pending Self Assessment' | 'Pending Manager Assessment' | 'Completed';
    created_at: string;
    updated_at: string;
    cycle?: ReviewCycle;
    employee?: {
        first_name: string;
        last_name: string;
        email: string;
    };
    reviewer?: {
        first_name: string;
        last_name: string;
    } | null;
}

interface Goal {
    id: string;
    employee_id: string;
    title: string;
    description: string;
    target_date: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled';
    progress: number;
    created_at: string;
}

interface Employee {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    employee_code: string;
}

export default function PerformancePage() {
    const supabase = createClient();
    const { role, employeeId, isAdmin, loading: roleLoading } = useUserRole();

    const [activeTab, setActiveTab] = useState<'appraisals' | 'goals'>('appraisals');
    
    // Core data states
    const [cycles, setCycles] = useState<ReviewCycle[]>([]);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Appraisal states
    const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
    const [selfRating, setSelfRating] = useState<number>(3);
    const [selfFeedback, setSelfFeedback] = useState<string>('');
    const [managerRating, setManagerRating] = useState<number>(3);
    const [managerFeedback, setManagerFeedback] = useState<string>('');
    const [hrFeedback, setHrFeedback] = useState<string>('');
    const [isAppraisalModalOpen, setIsAppraisalModalOpen] = useState(false);

    // Goal states
    const [goalTitle, setGoalTitle] = useState('');
    const [goalDesc, setGoalDesc] = useState('');
    const [goalTargetDate, setGoalTargetDate] = useState('');
    const [goalPriority, setGoalPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
    const [goalProgress, setGoalProgress] = useState(0);
    const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    // Admin states
    const [isCreateCycleModalOpen, setIsCreateCycleModalOpen] = useState(false);
    const [cycleTitle, setCycleTitle] = useState('');
    const [cycleDesc, setCycleDesc] = useState('');
    const [cycleStart, setCycleStart] = useState('');
    const [cycleEnd, setCycleEnd] = useState('');

    const [isAssignReviewModalOpen, setIsAssignReviewModalOpen] = useState(false);
    const [assignCycleId, setAssignCycleId] = useState('');
    const [assignEmpId, setAssignEmpId] = useState('');
    const [assignReviewerId, setAssignReviewerId] = useState('');

    const isHrOrAdmin = role === 'admin' || role === 'hr';

    useEffect(() => {
        if (!roleLoading) {
            fetchData();
        }
    }, [roleLoading, role, employeeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch cycles
            const { data: cyclesData } = await supabase
                .from('performance_review_cycle')
                .select('*')
                .order('created_at', { ascending: false });
            setCycles(cyclesData || []);

            // 2. Fetch reviews
            let query = supabase.from('performance_review').select(`
                *,
                cycle:performance_review_cycle(*),
                employee:employee(first_name, last_name, email),
                reviewer:employee!performance_review_reviewer_id_fkey(first_name, last_name)
            `);

            if (!isHrOrAdmin && employeeId) {
                // Regular employees only see reviews where they are the subject or the reviewer
                query = query.or(`employee_id.eq.${employeeId},reviewer_id.eq.${employeeId}`);
            }

            const { data: reviewsData } = await query;
            setReviews((reviewsData || []) as any[]);

            // 3. Fetch goals for current employee
            if (employeeId) {
                const { data: goalsData } = await supabase
                    .from('performance_goal')
                    .select('*')
                    .eq('employee_id', employeeId)
                    .order('created_at', { ascending: false });
                setGoals(goalsData || []);
            }

            // 4. Fetch all employees for drop-downs
            if (isHrOrAdmin) {
                const { data: empData } = await supabase
                    .from('employee')
                    .select('id, first_name, last_name, email, employee_code')
                    .order('first_name', { ascending: true });
                setEmployees(empData || []);
            }
        } catch (error) {
            console.error("Failed to fetch performance data", error);
            toast.error("Failed to load performance module data.");
        } finally {
            setLoading(false);
        }
    };

    // Cycle Management
    const handleCreateCycle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cycleTitle || !cycleStart || !cycleEnd) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('performance_review_cycle')
                .insert({
                    title: cycleTitle,
                    description: cycleDesc,
                    start_date: cycleStart,
                    end_date: cycleEnd,
                    status: 'Draft'
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Review cycle created successfully!");
            await logAudit('CREATE_CYCLE', 'performance_review_cycle', data.id, { title: cycleTitle });
            setIsCreateCycleModalOpen(false);
            setCycleTitle('');
            setCycleDesc('');
            setCycleStart('');
            setCycleEnd('');
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to create cycle.");
        }
    };

    const handleUpdateCycleStatus = async (cycleId: string, status: 'Draft' | 'Active' | 'Completed') => {
        try {
            const { error } = await supabase
                .from('performance_review_cycle')
                .update({ status })
                .eq('id', cycleId);

            if (error) throw error;
            toast.success(`Cycle updated to ${status}`);
            await logAudit('UPDATE_CYCLE_STATUS', 'performance_review_cycle', cycleId, { status });
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to update cycle status.");
        }
    };

    // Assign Appraisal
    const handleAssignReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignCycleId || !assignEmpId) {
            toast.error("Please select a cycle and employee.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('performance_review')
                .insert({
                    cycle_id: assignCycleId,
                    employee_id: assignEmpId,
                    reviewer_id: assignReviewerId || null,
                    status: 'Pending Self Assessment'
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new Error("This employee is already registered in this cycle.");
                }
                throw error;
            }

            toast.success("Appraisal assigned successfully!");
            await logAudit('ASSIGN_APPRAISAL', 'performance_review', data.id, { employee_id: assignEmpId });
            setIsAssignReviewModalOpen(false);
            setAssignCycleId('');
            setAssignEmpId('');
            setAssignReviewerId('');
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to assign appraisal.");
        }
    };

    // Submit Appraisal Form (Self or Manager)
    const handleOpenAppraisal = (rev: PerformanceReview) => {
        setSelectedReview(rev);
        setSelfRating(rev.self_rating || 3);
        setSelfFeedback(rev.self_feedback || '');
        setManagerRating(rev.manager_rating || 3);
        setManagerFeedback(rev.manager_feedback || '');
        setHrFeedback(rev.hr_feedback || '');
        setIsAppraisalModalOpen(true);
    };

    const handleSubmitAppraisal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReview) return;

        const isSubject = selectedReview.employee_id === employeeId;
        const isReviewer = selectedReview.reviewer_id === employeeId;

        try {
            let updates: any = {};

            if (isSubject) {
                updates.self_rating = selfRating;
                updates.self_feedback = selfFeedback;
                updates.status = 'Pending Manager Assessment';
            } else if (isReviewer || isHrOrAdmin) {
                updates.manager_rating = managerRating;
                updates.manager_feedback = managerFeedback;
                updates.hr_feedback = hrFeedback;
                updates.status = 'Completed';
            }

            const { error } = await supabase
                .from('performance_review')
                .update(updates)
                .eq('id', selectedReview.id);

            if (error) throw error;

            toast.success("Appraisal review submitted successfully!");
            await logAudit('SUBMIT_APPRAISAL', 'performance_review', selectedReview.id, {
                by_employee_id: employeeId,
                role_type: isSubject ? 'employee' : 'manager/hr'
            });
            setIsAppraisalModalOpen(false);
            setSelectedReview(null);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to submit appraisal.");
        }
    };

    // Goal Management
    const handleOpenAddGoal = () => {
        setEditingGoalId(null);
        setGoalTitle('');
        setGoalDesc('');
        setGoalTargetDate('');
        setGoalPriority('Medium');
        setGoalProgress(0);
        setIsAddGoalModalOpen(true);
    };

    const handleOpenEditGoal = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setGoalTitle(goal.title);
        setGoalDesc(goal.description || '');
        setGoalTargetDate(goal.target_date || '');
        setGoalPriority(goal.priority);
        setGoalProgress(goal.progress);
        setIsAddGoalModalOpen(true);
    };

    const handleSaveGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!goalTitle) {
            toast.error("Goal Title is required.");
            return;
        }

        if (!employeeId) {
            toast.error("No linked employee account found.");
            return;
        }

        try {
            let status: Goal['status'] = 'Not Started';
            if (goalProgress > 0 && goalProgress < 100) {
                status = 'In Progress';
            } else if (goalProgress === 100) {
                status = 'Completed';
            }

            if (editingGoalId) {
                // Update
                const { error } = await supabase
                    .from('performance_goal')
                    .update({
                        title: goalTitle,
                        description: goalDesc,
                        target_date: goalTargetDate || null,
                        priority: goalPriority,
                        progress: goalProgress,
                        status
                    })
                    .eq('id', editingGoalId);

                if (error) throw error;
                toast.success("Goal updated successfully!");
                await logAudit('UPDATE_GOAL', 'performance_goal', editingGoalId, { title: goalTitle, progress: goalProgress });
            } else {
                // Create
                const { data, error } = await supabase
                    .from('performance_goal')
                    .insert({
                        employee_id: employeeId,
                        title: goalTitle,
                        description: goalDesc,
                        target_date: goalTargetDate || null,
                        priority: goalPriority,
                        progress: goalProgress,
                        status
                    })
                    .select()
                    .single();

                if (error) throw error;
                toast.success("Goal added successfully!");
                await logAudit('CREATE_GOAL', 'performance_goal', data.id, { title: goalTitle });
            }

            setIsAddGoalModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to save goal.");
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;
        try {
            const { error } = await supabase
                .from('performance_goal')
                .delete()
                .eq('id', goalId);

            if (error) throw error;
            toast.success("Goal deleted.");
            await logAudit('DELETE_GOAL', 'performance_goal', goalId);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete goal.");
        }
    };

    if (roleLoading || loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Performance Reviews" 
                description="Appraisals, development tracks, and personal milestones." 
            />

            {/* Premium Tab Buttons */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('appraisals')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === 'appraisals'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Award className="w-4.5 h-4.5" />
                    Appraisals & Reviews
                </button>
                <button
                    onClick={() => setActiveTab('goals')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === 'goals'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <Target className="w-4.5 h-4.5" />
                    Goals Tracker
                </button>
            </div>

            {/* TAB CONTENT: APPRAISALS & CYCLES */}
            {activeTab === 'appraisals' && (
                <div className="space-y-6">
                    {/* Admin Dashboard Statistics & Control Bar */}
                    {isHrOrAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-2xl border border-indigo-200 shadow-sm relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
                                    <Award className="w-32 h-32 text-indigo-950" />
                                </div>
                                <h4 className="text-indigo-850 text-sm font-semibold uppercase tracking-wider">Active Cycles</h4>
                                <p className="text-3xl font-black text-indigo-950 mt-2">
                                    {cycles.filter(c => c.status === 'Active').length}
                                </p>
                                <span className="text-xs text-indigo-700 mt-1 block">Review programs currently running</span>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-10">
                                    <CheckCircle2 className="w-32 h-32 text-emerald-950" />
                                </div>
                                <h4 className="text-emerald-850 text-sm font-semibold uppercase tracking-wider">Completed Reviews</h4>
                                <p className="text-3xl font-black text-emerald-950 mt-2">
                                    {reviews.filter(r => r.status === 'Completed').length}
                                </p>
                                <span className="text-xs text-emerald-700 mt-1 block">Evaluations successfully signed off</span>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                <div>
                                    <h4 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Management Controls</h4>
                                    <p className="text-xs text-slate-500 mt-1">Deploy review cycles and assign reviewers.</p>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={() => setIsCreateCycleModalOpen(true)}
                                        className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-lg"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        New Cycle
                                    </button>
                                    <button
                                        onClick={() => setIsAssignReviewModalOpen(true)}
                                        className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-250 hover:bg-indigo-100 transition rounded-lg"
                                    >
                                        <UserCheck className="w-3.5 h-3.5" />
                                        Assign Appraisal
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Cycles Section */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-5 border-b border-slate-200">
                            <h3 className="font-bold text-slate-900 text-base">Appraisal Cycles</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Global performance evaluation milestones</p>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {cycles.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    No appraisal cycles available.
                                </div>
                            ) : (
                                cycles.map(cycle => (
                                    <div key={cycle.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-slate-800 text-sm">{cycle.title}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                                                    cycle.status === 'Active'
                                                        ? 'bg-emerald-55 text-emerald-800'
                                                        : cycle.status === 'Completed'
                                                        ? 'bg-slate-100 text-slate-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {cycle.status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 max-w-xl">{cycle.description || 'No description provided.'}</p>
                                            <div className="flex items-center gap-3 text-slate-400 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {cycle.start_date} to {cycle.end_date}
                                                </span>
                                            </div>
                                        </div>
                                        {isHrOrAdmin && (
                                            <div className="flex items-center gap-1">
                                                {cycle.status === 'Draft' && (
                                                    <button
                                                        onClick={() => handleUpdateCycleStatus(cycle.id, 'Active')}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
                                                    >
                                                        Launch Cycle
                                                    </button>
                                                )}
                                                {cycle.status === 'Active' && (
                                                    <button
                                                        onClick={() => handleUpdateCycleStatus(cycle.id, 'Completed')}
                                                        className="px-3 py-1.5 text-xs font-semibold bg-slate-700 text-white rounded-md hover:bg-slate-800 transition"
                                                    >
                                                        Complete Cycle
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Appraisals / Submissions List */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-5 border-b border-slate-200">
                            <h3 className="font-bold text-slate-900 text-base">Appraisal Reports & Self Assessments</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Perform self appraisal or complete subordinate assessments</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold text-xs uppercase">
                                        <th className="p-4">Employee</th>
                                        <th className="p-4">Review Cycle</th>
                                        <th className="p-4">Reviewer</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Ratings (Self / Mgr)</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reviews.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                                                No appraisal profiles assigned.
                                            </td>
                                        </tr>
                                    ) : (
                                        reviews.map(rev => {
                                            const isSubject = rev.employee_id === employeeId;
                                            const isReviewer = rev.reviewer_id === employeeId;
                                            
                                            // Status Badge configuration
                                            let badgeClass = 'bg-slate-100 text-slate-800';
                                            if (rev.status === 'Pending Self Assessment') badgeClass = 'bg-violet-100 text-violet-850';
                                            if (rev.status === 'Pending Manager Assessment') badgeClass = 'bg-amber-100 text-amber-850';
                                            if (rev.status === 'Completed') badgeClass = 'bg-emerald-100 text-emerald-850';

                                            return (
                                                <tr key={rev.id} className="hover:bg-slate-50/50 transition">
                                                    <td className="p-4">
                                                        <div className="font-semibold text-slate-800 text-sm">
                                                            {rev.employee ? `${rev.employee.first_name} ${rev.employee.last_name}` : 'Self'}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {rev.employee?.email}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-600 text-xs">
                                                        {rev.cycle?.title || 'Unknown Cycle'}
                                                    </td>
                                                    <td className="p-4 text-slate-600 text-xs">
                                                        {rev.reviewer ? `${rev.reviewer.first_name} ${rev.reviewer.last_name}` : 'No reviewer assigned'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${badgeClass}`}>
                                                            {rev.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1">
                                                            <div className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold">
                                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                                {rev.self_rating || '-'}
                                                            </div>
                                                            <span className="text-slate-300">/</span>
                                                            <div className="flex items-center gap-0.5 text-xs text-indigo-600 font-semibold">
                                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                                {rev.manager_rating || '-'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {/* Action Buttons */}
                                                        {isSubject && rev.status === 'Pending Self Assessment' && (
                                                            <button
                                                                onClick={() => handleOpenAppraisal(rev)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-md"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                                Fill Self-Appraisal
                                                            </button>
                                                        )}
                                                        {(isReviewer || isHrOrAdmin) && rev.status === 'Pending Manager Assessment' && (
                                                            <button
                                                                onClick={() => handleOpenAppraisal(rev)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition rounded-md"
                                                            >
                                                                <Sliders className="w-3.5 h-3.5" />
                                                                Evaluate
                                                            </button>
                                                        )}
                                                        {rev.status === 'Completed' && (
                                                            <button
                                                                onClick={() => handleOpenAppraisal(rev)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition rounded-md"
                                                            >
                                                                View Appraisal
                                                            </button>
                                                        )}
                                                        {/* Fallback read mode for unresolved cycles */}
                                                        {isHrOrAdmin && rev.status !== 'Completed' && !isSubject && !isReviewer && (
                                                            <button
                                                                onClick={() => handleOpenAppraisal(rev)}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition rounded-md"
                                                            >
                                                                Inspect / Edit
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: GOALS TRACKER */}
            {activeTab === 'goals' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                            <h3 className="font-bold text-slate-900 text-base">Key Performance Indicators (KPIs)</h3>
                            <p className="text-slate-500 text-xs mt-0.5">Manage your goals, track progress, and coordinate milestones.</p>
                        </div>
                        <button
                            onClick={handleOpenAddGoal}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-lg shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Target Goal
                        </button>
                    </div>

                    {/* Goals Grid */}
                    {goals.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
                            <Target className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                            <h4 className="text-slate-700 font-semibold mt-4 text-sm">No Active Goals Set</h4>
                            <p className="text-slate-400 text-xs mt-1">Get started by creating your first performance objective.</p>
                            <button
                                onClick={handleOpenAddGoal}
                                className="mt-4 inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-md"
                            >
                                <Plus className="w-3.5 h-3.5" /> Add Goal
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {goals.map(goal => {
                                // Priority config
                                let prioColor = 'bg-slate-100 text-slate-800';
                                if (goal.priority === 'Critical') prioColor = 'bg-rose-100 text-rose-800';
                                if (goal.priority === 'High') prioColor = 'bg-orange-100 text-orange-800';
                                if (goal.priority === 'Medium') prioColor = 'bg-amber-100 text-amber-800';

                                return (
                                    <div key={goal.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${prioColor}`}>
                                                    {goal.priority}
                                                </span>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenEditGoal(goal)}
                                                        className="text-slate-400 hover:text-indigo-600 transition"
                                                        title="Edit Goal"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteGoal(goal.id)}
                                                        className="text-slate-400 hover:text-rose-600 transition"
                                                        title="Delete Goal"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-800 text-sm">{goal.title}</h4>
                                            <p className="text-xs text-slate-500 line-clamp-3">{goal.description || 'No description added.'}</p>
                                        </div>

                                        <div className="space-y-2">
                                            {/* Progress bar */}
                                            <div className="flex justify-between items-center text-xs font-semibold">
                                                <span className="text-slate-500">Progress</span>
                                                <span className="text-indigo-650">{goal.progress}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                                    style={{ width: `${goal.progress}%` }}
                                                />
                                            </div>

                                            {/* Footer dates */}
                                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Due: {goal.target_date || 'N/A'}
                                                </span>
                                                <span className="capitalize font-medium text-slate-500">{goal.status.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: APPRAISAL SUBMISSION / VIEW */}
            {isAppraisalModalOpen && selectedReview && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
                        <div className="p-6 border-b border-slate-150 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Appraisal Submission</h3>
                            <button
                                onClick={() => setIsAppraisalModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAppraisal} className="p-6 space-y-6">
                            {/* General Context */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs text-slate-650">
                                <p><span className="font-semibold text-slate-850">Employee:</span> {selectedReview.employee ? `${selectedReview.employee.first_name} ${selectedReview.employee.last_name}` : 'Self'}</p>
                                <p><span className="font-semibold text-slate-850">Cycle:</span> {selectedReview.cycle?.title}</p>
                                <p><span className="font-semibold text-slate-850">Target reviewer:</span> {selectedReview.reviewer ? `${selectedReview.reviewer.first_name} ${selectedReview.reviewer.last_name}` : 'N/A'}</p>
                            </div>

                            {/* Section 1: Self Appraisal */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-indigo-850 text-sm border-b border-slate-100 pb-1.5">Section A: Employee Self Appraisal</h4>
                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-slate-700">Self Evaluation Rating (1-5)</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                disabled={selectedReview.employee_id !== employeeId || selectedReview.status !== 'Pending Self Assessment'}
                                                onClick={() => setSelfRating(star)}
                                                className={`p-2 rounded-lg border flex-1 text-center font-bold text-sm transition-all duration-150 ${
                                                    selfRating === star
                                                        ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                {star} Star{star > 1 && 's'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-slate-700">Self Feedback & Accomplishments</label>
                                    <textarea
                                        rows={3}
                                        value={selfFeedback}
                                        disabled={selectedReview.employee_id !== employeeId || selectedReview.status !== 'Pending Self Assessment'}
                                        onChange={(e) => setSelfFeedback(e.target.value)}
                                        className="w-full text-sm border border-slate-250 rounded-xl p-3 focus:outline-indigo-550 disabled:bg-slate-50 disabled:text-slate-500"
                                        placeholder="Outline your accomplishments, challenges, and aspirations during this cycle..."
                                    />
                                </div>
                            </div>

                            {/* Section 2: Manager/HR Assessment */}
                            {(selectedReview.status !== 'Pending Self Assessment' || isHrOrAdmin) && (
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <h4 className="font-bold text-amber-850 text-sm border-b border-slate-100 pb-1.5">Section B: Managerial Review</h4>
                                    <div className="space-y-3">
                                        <label className="block text-xs font-semibold text-slate-700">Manager Rating (1-5)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    disabled={(selectedReview.reviewer_id !== employeeId && !isHrOrAdmin) || selectedReview.status !== 'Pending Manager Assessment'}
                                                    onClick={() => setManagerRating(star)}
                                                    className={`p-2 rounded-lg border flex-1 text-center font-bold text-sm transition-all duration-150 ${
                                                        managerRating === star
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {star} Star{star > 1 && 's'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-700">Manager Feedback</label>
                                        <textarea
                                            rows={3}
                                            value={managerFeedback}
                                            disabled={(selectedReview.reviewer_id !== employeeId && !isHrOrAdmin) || selectedReview.status !== 'Pending Manager Assessment'}
                                            onChange={(e) => setManagerFeedback(e.target.value)}
                                            className="w-full text-sm border border-slate-250 rounded-xl p-3 focus:outline-indigo-550 disabled:bg-slate-50 disabled:text-slate-500"
                                            placeholder="Provide evaluation regarding the employee's KPIs, growth area, and competencies..."
                                        />
                                    </div>

                                    {isHrOrAdmin && (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-slate-700">HR Advisory & Administrative Notes</label>
                                            <textarea
                                                rows={2}
                                                value={hrFeedback}
                                                onChange={(e) => setHrFeedback(e.target.value)}
                                                className="w-full text-sm border border-slate-250 rounded-xl p-3 focus:outline-indigo-550"
                                                placeholder="HR admin compliance parameters and training suggestions..."
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAppraisalModalOpen(false)}
                                    className="px-4 py-2 border border-slate-250 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Close
                                </button>
                                {((selectedReview.employee_id === employeeId && selectedReview.status === 'Pending Self Assessment') ||
                                  ((selectedReview.reviewer_id === employeeId || isHrOrAdmin) && selectedReview.status === 'Pending Manager Assessment')) && (
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 shadow-sm transition"
                                    >
                                        Submit Appraisal
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE CYCLE */}
            {isCreateCycleModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
                        <div className="p-5 border-b border-slate-150 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Create Appraisal Cycle</h3>
                            <button
                                onClick={() => setIsCreateCycleModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateCycle} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Cycle Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={cycleTitle}
                                    onChange={(e) => setCycleTitle(e.target.value)}
                                    placeholder="e.g. Q2 2026 Annual Assessment"
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Description</label>
                                <textarea
                                    rows={2}
                                    value={cycleDesc}
                                    onChange={(e) => setCycleDesc(e.target.value)}
                                    placeholder="Provide goals for this cycle..."
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Start Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={cycleStart}
                                        onChange={(e) => setCycleStart(e.target.value)}
                                        className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">End Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={cycleEnd}
                                        onChange={(e) => setCycleEnd(e.target.value)}
                                        className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateCycleModalOpen(false)}
                                    className="px-4 py-2 border border-slate-250 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ASSIGN REVIEW */}
            {isAssignReviewModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
                        <div className="p-5 border-b border-slate-150 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Assign Employee appraisal</h3>
                            <button
                                onClick={() => setIsAssignReviewModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleAssignReview} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Appraisal Cycle *</label>
                                <select
                                    required
                                    value={assignCycleId}
                                    onChange={(e) => setAssignCycleId(e.target.value)}
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                >
                                    <option value="">-- Select Cycle --</option>
                                    {cycles.map(c => (
                                        <option key={c.id} value={c.id}>{c.title} ({c.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Subject Employee *</label>
                                <select
                                    required
                                    value={assignEmpId}
                                    onChange={(e) => setAssignEmpId(e.target.value)}
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                >
                                    <option value="">-- Select Employee --</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Assigned Evaluator (Manager/HR)</label>
                                <select
                                    value={assignReviewerId}
                                    onChange={(e) => setAssignReviewerId(e.target.value)}
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                >
                                    <option value="">-- No designated evaluator (Admin only) --</option>
                                    {employees.map(e => (
                                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAssignReviewModalOpen(false)}
                                    className="px-4 py-2 border border-slate-250 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                                >
                                    Assign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ADD / EDIT GOAL */}
            {isAddGoalModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
                        <div className="p-5 border-b border-slate-150 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">
                                {editingGoalId ? "Edit Performance Goal" : "Add Performance Goal"}
                            </h3>
                            <button
                                onClick={() => setIsAddGoalModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleSaveGoal} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Goal Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={goalTitle}
                                    onChange={(e) => setGoalTitle(e.target.value)}
                                    placeholder="e.g. Automate deployment pipeline"
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Description</label>
                                <textarea
                                    rows={3}
                                    value={goalDesc}
                                    onChange={(e) => setGoalDesc(e.target.value)}
                                    placeholder="Outline success criteria, milestones, or quantitative KPIs..."
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Target Date</label>
                                    <input
                                        type="date"
                                        value={goalTargetDate}
                                        onChange={(e) => setGoalTargetDate(e.target.value)}
                                        className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
                                    <select
                                        value={goalPriority}
                                        onChange={(e: any) => setGoalPriority(e.target.value)}
                                        className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                    <span>Goal Progress</span>
                                    <span className="text-indigo-600 font-bold">{goalProgress}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={goalProgress}
                                    onChange={(e) => setGoalProgress(parseInt(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Not Started</span>
                                    <span>Halfway</span>
                                    <span>Completed</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddGoalModalOpen(false)}
                                    className="px-4 py-2 border border-slate-250 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                                >
                                    Save Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
