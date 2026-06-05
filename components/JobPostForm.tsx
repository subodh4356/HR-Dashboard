'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const jobSchema = z.object({
    title: z.string().min(2, 'Job title is required'),
    department: z.string().min(1, 'Department is required'),
    location: z.string().min(1, 'Location is required'),
    type: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    status: z.enum(['open', 'closed', 'draft']),
});

type JobFormValues = z.infer<typeof jobSchema>;

export default function JobPostForm() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        defaultValues: {
            title: '',
            department: '',
            location: '',
            type: 'Full-time',
            description: '',
            status: 'open',
        },
    });

    // Fetch Departments for dropdown
    useEffect(() => {
        const fetchDepts = async () => {
            const { data } = await supabase.from('department').select('name');
            if (data) setDepartments(data);
        };
        fetchDepts();
    }, [supabase]);

    const onSubmit = async (data: JobFormValues) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('job_posting').insert(data);
            if (error) throw error;
            router.push('/recruitment');
            router.refresh();
        } catch (error: any) {
            alert('Error creating job: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <input {...form.register('title')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="e.g. Senior Software Engineer" />
                    {form.formState.errors.title && <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    {/* Use loose text if depts not loaded, or dropdown */}
                    <input {...form.register('department')} list="dept-list" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" />
                    <datalist id="dept-list">
                        {departments.map((d, i) => <option key={i} value={d.name} />)}
                    </datalist>
                    {form.formState.errors.department && <p className="text-red-500 text-xs mt-1">{form.formState.errors.department.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input {...form.register('location')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="e.g. New York, Remote" />
                    {form.formState.errors.location && <p className="text-red-500 text-xs mt-1">{form.formState.errors.location.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                    <select {...form.register('type')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2">
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select {...form.register('status')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2">
                        <option value="open">Open</option>
                        <option value="draft">Draft</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Job Description</label>
                    <textarea {...form.register('description')} rows={5} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2" placeholder="Describe the role, responsibilities, and requirements..." />
                    {form.formState.errors.description && <p className="text-red-500 text-xs mt-1">{form.formState.errors.description.message}</p>}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mr-3 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border border-gray-300"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Job
                </button>
            </div>
        </form>
    );
}
