'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import LeaveRequestForm from '@/components/LeaveRequestForm';
import DataTable, { Column } from '@/components/DataTable';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { useUserRole } from '@/hooks/useUserRole';

// Tabs for Admin
type Tab = 'my_requests' | 'approvals' | 'history';

export default function LeavePageClient({
    myRequests,
    pendingRequests,
    allRequests
}: {
    myRequests: any[];
    pendingRequests: any[];
    allRequests: any[];
}) {
    const router = useRouter();
    const { role } = useUserRole();
    const isAdmin = role === 'admin';
    const [activeTab, setActiveTab] = useState<Tab>(isAdmin ? 'approvals' : 'my_requests');
    const supabase = createClient();
    const [processing, setProcessing] = useState<string | null>(null);

    const handleAction = async (id: string, action: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${action} this request?`)) return;
        setProcessing(id);

        const { error } = await supabase
            .from('leave_request')
            .update({ status: action })
            .eq('id', id);

        setProcessing(null);

        if (error) alert('Error: ' + error.message);
        else router.refresh();
    };

    // Columns for My Requests
    const myColumns: Column<any>[] = [
        { header: 'Type', cell: (row) => row.leave_policy?.name },
        { header: 'From', cell: (row) => format(new Date(row.start_date), 'MMM d') },
        { header: 'To', cell: (row) => format(new Date(row.end_date), 'MMM d') },
        { header: 'Days', accessorKey: 'days' }, // Note: DB column is 'days' now
        { header: 'Status', cell: (row) => <StatusBadge status={row.status} /> }
    ];

    // Columns for Admin Approvals/History
    const adminColumns: Column<any>[] = [
        { header: 'Employee', cell: (row) => `${row.employee?.first_name} ${row.employee?.last_name}` },
        { header: 'Type', cell: (row) => row.leave_policy?.name },
        { header: 'From', cell: (row) => format(new Date(row.start_date), 'MMM d') },
        { header: 'To', cell: (row) => format(new Date(row.end_date), 'MMM d') },
        { header: 'Days', accessorKey: 'days' },
        { header: 'Reason', accessorKey: 'reason' },
        {
            header: 'Actions',
            cell: (row) => row.status === 'pending' ? (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleAction(row.id, 'approved')}
                        disabled={!!processing}
                        className="bg-green-600 text-white text-xs px-2 py-1 rounded hover:bg-green-700"
                    >
                        Approve
                    </button>
                    <button
                        onClick={() => handleAction(row.id, 'rejected')}
                        disabled={!!processing}
                        className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700"
                    >
                        Reject
                    </button>
                </div>
            ) : <StatusBadge status={row.status} />
        }
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <PageHeader title={isAdmin ? "Leave Management (HR)" : "My Leave"} />
                {isAdmin && (
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('approvals')}
                            className={`px-4 py-2 text-sm rounded-md ${activeTab === 'approvals' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            Approvals ({pendingRequests.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 text-sm rounded-md ${activeTab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            All History
                        </button>
                        <button
                            onClick={() => setActiveTab('my_requests')}
                            className={`px-4 py-2 text-sm rounded-md ${activeTab === 'my_requests' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            My Requests
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Application Form (Visible on My Requests or generally if not in Admin view) */}
                {(activeTab === 'my_requests' || !isAdmin) && (
                    <div className="lg:col-span-1">
                        <LeaveRequestForm onSuccess={() => router.refresh()} />
                    </div>
                )}

                <div className={(activeTab === 'my_requests' || !isAdmin) ? "lg:col-span-2" : "col-span-3"}>
                    {activeTab === 'my_requests' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">My Leave History</h3>
                            <DataTable columns={myColumns} data={myRequests} />
                        </div>
                    )}

                    {activeTab === 'approvals' && isAdmin && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
                            {pendingRequests.length === 0 ? (
                                <p className="text-gray-500 italic">No pending requests.</p>
                            ) : (
                                <DataTable columns={adminColumns} data={pendingRequests} />
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && isAdmin && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">All Employee Leave History</h3>
                            <DataTable columns={adminColumns} data={allRequests} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const colors = {
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800'
    };
    // @ts-ignore
    const color = colors[status] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${color}`}>
            {status}
        </span>
    );
}
