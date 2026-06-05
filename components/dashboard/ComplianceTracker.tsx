'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import StatusIndicator from './ui/StatusIndicator';

// --- Types ---
export interface ComplianceRecord {
    id: string;
    title: string;
    description?: string;
    category?: string;
    status: 'Compliant' | 'Non-Compliant' | 'Pending' | 'Overdue' | 'Upcoming';
    due_date: string;
    completed_date?: string;
    document_url?: string;
    remarks?: string;
}

// --- Zod Schema ---
const complianceSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    category: z.string().optional(),
    due_date: z.string().min(1, 'Due date is required'),
    status: z.enum(['Compliant', 'Non-Compliant', 'Pending', 'Overdue', 'Upcoming']),
    remarks: z.string().optional(),
});

type ComplianceFormValues = z.infer<typeof complianceSchema>;

export default function ComplianceTracker() {
    const supabase = createClient();
    const [records, setRecords] = useState<ComplianceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<ComplianceFormValues>({
        resolver: zodResolver(complianceSchema),
        defaultValues: {
            status: 'Pending',
            category: 'Labour Laws',
        },
    });

    const fetchRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('compliance_records')
            .select('*')
            .order('due_date', { ascending: true });

        if (!error && data) {
            setRecords(data as ComplianceRecord[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const onSubmit = async (data: ComplianceFormValues) => {
        setSubmitting(true);
        try {
            const { error } = await supabase.from('compliance_records').insert(data);
            if (error) throw error;
            fetchRecords();
            setIsAdding(false);
            form.reset();
        } catch (e: any) {
            alert('Error adding compliance record: ' + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to determine status color
    const getStatusType = (status: ComplianceRecord['status']) => {
        switch (status) {
            case 'Compliant': return 'success';
            case 'Pending': return 'neutral';
            case 'Upcoming': return 'warning';
            case 'Overdue': return 'error';
            case 'Non-Compliant': return 'error';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Compliance Tracker</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    <Plus size={18} />
                    Add Record
                </button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-white p-6 rounded-lg shadow border border-blue-100 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-medium mb-4">New Compliance Record</h3>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input {...form.register('title')} className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="e.g. Shops Act Renewal" />
                                {form.formState.errors.title && <span className="text-red-500 text-xs">{form.formState.errors.title.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select {...form.register('category')} className="w-full border rounded-md p-2 text-sm">
                                    <option value="Labour Laws">Labour Laws</option>
                                    <option value="Tax">Tax</option>
                                    <option value="Internal">Internal Policy</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input type="date" {...form.register('due_date')} className="w-full border rounded-md p-2 text-sm" />
                                {form.formState.errors.due_date && <span className="text-red-500 text-xs">{form.formState.errors.due_date.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select {...form.register('status')} className="w-full border rounded-md p-2 text-sm">
                                    <option value="Pending">Pending</option>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Overdue">Overdue</option>
                                    <option value="Compliant">Compliant</option>
                                    <option value="Non-Compliant">Non-Compliant</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">Cancel</button>
                            <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                                {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : records.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">No compliance records found. Add one to get started.</div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {records.map((record) => (
                        <div key={record.id} className={cn(
                            "bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden",
                            record.status === 'Overdue' || record.status === 'Non-Compliant' ? 'border-l-4 border-l-red-500' :
                                record.status === 'Compliant' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-blue-400'
                        )}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{record.category}</span>
                                <StatusIndicator status={getStatusType(record.status)} text={record.status} />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">{record.title}</h3>
                            <div className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                                <Clock size={14} />
                                <span>Due: {format(new Date(record.due_date), 'MMM dd, yyyy')}</span>
                            </div>

                            {/* Action / Details */}
                            <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                <span className="text-xs text-gray-400">ID: {record.id.slice(0, 8)}</span>
                                <button className="text-blue-600 text-sm hover:underline">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
