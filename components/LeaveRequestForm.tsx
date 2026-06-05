'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logAudit } from '@/lib/audit';

const leaveSchema = z.object({
    leave_policy_id: z.string().min(1, 'Select a leave type'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    reason: z.string().min(3, 'Reason is required'),
});

type LeaveFormValues = z.infer<typeof leaveSchema>;

export default function LeaveRequestForm({ onSuccess }: { onSuccess?: () => void }) {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [policies, setPolicies] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveSchema),
    });

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Fetch employee ID
                const { data: profile } = await supabase
                    .from('user_profile')
                    .select('employee_id')
                    .eq('id', user.id)
                    .single();
                if (profile) setUserId(profile.employee_id);
            }

            const { data } = await supabase.from('leave_policy').select('*');
            setPolicies(data || []);
        };
        init();
    }, [supabase]);

    const onSubmit = async (data: LeaveFormValues) => {
        if (!userId) {
            alert("Employee record not found. Please contact HR.");
            return;
        }
        setLoading(true);
        try {
            // Calculate days - simplified
            const start = new Date(data.start_date);
            const end = new Date(data.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const { data: newLeave, error } = await supabase.from('leave_request').insert({
                employee_id: userId,
                leave_policy_id: data.leave_policy_id,
                start_date: data.start_date,
                end_date: data.end_date,
                days: diffDays,
                reason: data.reason,
                status: 'pending'
            }).select().single();

            if (error) throw error;

            await logAudit('APPLY_LEAVE', 'leave_request', newLeave.id, { dates: `${data.start_date} to ${data.end_date}` });

            form.reset();
            router.refresh();
            form.reset();
            router.refresh();
            if (onSuccess) onSuccess();
            else toast.success('Leave request submitted successfully');

        } catch (error: any) {
            toast.error('Error submitting leave: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900">Apply for Leave</h3>

            <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                    {...form.register('leave_policy_id')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                >
                    <option value="">Select Type</option>
                    {policies.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.name} ({p.allocated_days} days/year)
                        </option>
                    ))}
                </select>
                {form.formState.errors.leave_policy_id && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.leave_policy_id.message}</p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                        {...form.register('start_date')}
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                    {form.formState.errors.start_date && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.start_date.message}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                        {...form.register('end_date')}
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    />
                    {form.formState.errors.end_date && (
                        <p className="text-red-500 text-xs mt-1">{form.formState.errors.end_date.message}</p>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <textarea
                    {...form.register('reason')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                />
                {form.formState.errors.reason && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.reason.message}</p>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </button>
            </div>
        </form>
    );
}
