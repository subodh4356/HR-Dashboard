'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeDocuments from '@/components/EmployeeDocuments';
import FileUploader from '@/components/FileUploader';
import { User, FileText, Calendar, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

type Tab = 'profile' | 'documents' | 'attendance' | 'leave';

export default function EmployeeDetailClient({
    employee,
    documents,
}: {
    employee: any;
    documents: any[];
}) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [docList, setDocList] = useState(documents || []);
    const supabase = createClient();

    // Helper to refresh docs list - in a real app would use React Query mutation
    const handleUploadComplete = async (path: string, fileName: string) => {
        // Save reference to DB
        const { data, error } = await supabase.from('file_ref').insert({
            bucket_id: 'employee-docs',
            file_path: path,
            file_name: fileName,
            entity_type: 'employee',
            entity_id: employee.id
        }).select().single();

        if (!error && data) {
            setDocList([...docList, { id: data.id, name: fileName, path: path }]);
        }
    };

    return (
        <div>
            <PageHeader title={`${employee.first_name} ${employee.last_name}`} />

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'profile', name: 'Profile', icon: User },
                        { id: 'documents', name: 'Documents', icon: FileText },
                        { id: 'attendance', name: 'Attendance', icon: Calendar },
                        { id: 'leave', name: 'Leave History', icon: ClipboardList },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={`${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                } group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium`}
                        >
                            <tab.icon
                                className={`${activeTab === tab.id
                                    ? 'text-blue-500'
                                    : 'text-gray-400 group-hover:text-gray-500'
                                    } -ml-0.5 mr-2 h-5 w-5`}
                            />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="mt-6">
                {activeTab === 'profile' && (
                    <div className="max-w-3xl">
                        <EmployeeForm initialData={employee} isEdit employeeId={employee.id} />
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="max-w-3xl">
                        <EmployeeDocuments employeeId={employee.id} isAdmin={true} />
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-gray-500">Attendance history will be shown here.</p>
                        {/* To be implemented in next steps */}
                    </div>
                )}

                {activeTab === 'leave' && (
                    <div className="rounded-lg bg-white p-6 shadow">
                        <p className="text-gray-500">Leave history will be shown here.</p>
                        {/* To be implemented in next steps */}
                    </div>
                )}
            </div>
        </div>
    );
}
