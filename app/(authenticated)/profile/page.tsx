'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import PageHeader from '@/components/PageHeader';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeDocuments from '@/components/EmployeeDocuments'; // Import new component
import { useUserRole } from '@/hooks/useUserRole';
import { User, FileText } from 'lucide-react';

export default function MyProfilePage() {
    const { employeeId, loading: roleLoading } = useUserRole();
    const [employee, setEmployee] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');
    const supabase = createClient();

    useEffect(() => {
        if (employeeId) {
            const fetchEmployee = async () => {
                const { data } = await supabase
                    .from('employee')
                    .select('*')
                    .eq('id', employeeId)
                    .single();
                if (data) setEmployee(data);
                setLoading(false);
            };
            fetchEmployee();
        } else if (!roleLoading) {
            setLoading(false);
        }
    }, [employeeId, roleLoading]);

    if (roleLoading || loading) return <div className="p-8">Loading profile...</div>;

    if (!employee) return (
        <div className="p-8">
            <PageHeader title="My Profile" />
            <p className="text-red-600">Employee record not found. Please contact HR.</p>
        </div>
    );

    return (
        <div>
            <PageHeader title="My Profile" />

            <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`${activeTab === 'profile'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        <User className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-400'}`} />
                        Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`${activeTab === 'documents'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                            } group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium`}
                    >
                        <FileText className={`-ml-0.5 mr-2 h-5 w-5 ${activeTab === 'documents' ? 'text-blue-500' : 'text-gray-400'}`} />
                        Documents
                    </button>
                </nav>
            </div>

            <div className="bg-white p-6 rounded shadow max-w-4xl">
                {activeTab === 'profile' && (
                    <EmployeeForm
                        initialData={employee}
                        isEdit={true}
                        employeeId={employee.id}
                    />
                )}
                {activeTab === 'documents' && (
                    <EmployeeDocuments employeeId={employee.id} isAdmin={false} />
                )}
            </div>
        </div>
    );
}
