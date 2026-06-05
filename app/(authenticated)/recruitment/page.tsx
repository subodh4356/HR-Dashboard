'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabaseClient';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function RecruitmentPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        const { data } = await supabase.from('job_posting').select('*').order('created_at', { ascending: false });
        if (data) setJobs(data);
        setLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <PageHeader title="Recruitment" />
                <Link href="/recruitment/new">
                    <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Job
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {jobs.length === 0 ? (
                        <li className="p-6 text-center text-gray-500">No active job postings.</li>
                    ) : (
                        jobs.map((job) => (
                            <li key={job.id} className="p-6 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                                    <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                                        <span>{job.department}</span>
                                        <span>&bull;</span>
                                        <span>{job.type}</span>
                                        <span>&bull;</span>
                                        <span>{job.location}</span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {job.status}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
