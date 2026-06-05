'use client';

import DataTable, { Column } from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';

export default function AttendanceAdminClient({ initialData }: { initialData: any[] }) {
    const columns: Column<any>[] = [
        {
            header: 'Date',
            accessorKey: 'date',
            cell: (row) => format(new Date(row.date), 'MMM d, yyyy'),
        },
        {
            header: 'Employee',
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.employee?.first_name} {row.employee?.last_name}</div>
                    <div className="text-xs text-gray-500">{row.employee?.email}</div>
                </div>
            )
        },
        {
            header: 'Check In',
            cell: (row) => row.check_in ? format(new Date(row.check_in), 'HH:mm') : '-',
        },
        {
            header: 'Check Out',
            cell: (row) => row.check_out ? format(new Date(row.check_out), 'HH:mm') : '-',
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (row) => (
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${row.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div>
            <PageHeader title="Attendance Records" />
            <DataTable columns={columns} data={initialData} />
        </div>
    );
}
