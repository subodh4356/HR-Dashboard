'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import CheckInOut from '@/components/CheckInOut';
import DataTable, { Column } from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import { format } from 'date-fns';

export default function AttendancePage() {
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchAttendance = async () => {
            const { data } = await supabase
                .from('attendance')
                .select('*, employee(first_name, last_name, email)')
                .order('date', { ascending: false });
            if (data) setAttendanceData(data);
        };
        fetchAttendance();
    }, []);

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
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${row.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div>
            <PageHeader title="Attendance" />

            <div className="grid grid-cols-1 gap-6 mb-8">
                {/* Check In Widget */}
                <CheckInOut />
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">All Employee Attendance</h3>
                </div>
                <div className="p-4">
                    <DataTable columns={columns} data={attendanceData} />
                </div>
            </div>
        </div>
    );
}
