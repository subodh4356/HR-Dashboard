'use client';

import DataTable, { Column } from '@/components/DataTable';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Employee = {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: { name: string } | null;
    designation?: { name: string } | null;
    status: string;
};

export default function EmployeeListClient({
    initialEmployees,
}: {
    initialEmployees: any[];
}) {
    const router = useRouter();
    const [employees] = useState<Employee[]>(initialEmployees);

    const columns: Column<Employee>[] = [
        {
            header: 'Name',
            cell: (emp) => (
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">
                        {emp.first_name[0]}
                        {emp.last_name[0]}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                        <div className="text-gray-500 text-xs">{emp.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Department',
            cell: (emp) => emp.department?.name || '-',
        },
        {
            header: 'Designation',
            cell: (emp) => emp.designation?.name || '-',
        },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: (emp) => (
                <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${emp.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}
                >
                    {emp.status}
                </span>
            ),
        },
    ];

    return (
        <div>
            <PageHeader
                title="Employees"
                actionLabel="Add Employee"
                actionUrl="/employees/new"
            />
            <DataTable
                columns={columns}
                data={employees}
                onRowClick={(emp) => router.push(`/employees/details/${emp.id}`)}
            />
        </div>
    );
}
