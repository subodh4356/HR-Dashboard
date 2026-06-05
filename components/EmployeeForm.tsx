'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { logAudit } from '@/lib/audit';
import FileUploader from '@/components/FileUploader';
import { createEmployeeAction, updateEmployeeAction } from '@/app/actions';

const employeeSchema = z.object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    department_id: z.string().optional(),
    designation_id: z.string().optional(),
    joining_date: z.string().min(1, 'Joining date is required'),
    status: z.enum(['active', 'inactive', 'on_leave', 'terminated']),
    // New Fields
    emp_code: z.string().optional(),
    dob: z.string().optional(),
    location: z.string().optional(),
    bank_details: z.object({
        bank_name: z.string().optional(),
        account_number: z.string().optional(),
        ifsc: z.string().optional(),
        pan: z.string().optional(),
    }).optional(),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export default function EmployeeForm({
    initialData,
    isEdit = false,
    employeeId,
}: {
    initialData?: Partial<EmployeeFormValues>;
    isEdit?: boolean;
    employeeId?: string;
}) {
    // ... existing hooks ...
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [designations, setDesignations] = useState<any[]>([]);

    const formInitialData = { ...initialData };
    if (initialData) {
        if ('employee_code' in initialData) {
            formInitialData.emp_code = (initialData as any).employee_code;
        }
        if ('date_of_birth' in initialData) {
            formInitialData.dob = (initialData as any).date_of_birth;
        }
    }

    const form = useForm<EmployeeFormValues>({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            status: 'active',
            bank_details: {}, // Ensure object exists
            ...formInitialData,
        },
    });

    // ... useEffect ...
    useEffect(() => {
        const fetchData = async () => {
            const { data: depts } = await supabase.from('department').select('*');
            const { data: desigs } = await supabase.from('designation').select('*');
            setDepartments(depts || []);
            setDesignations(desigs || []);
        };
        fetchData();
    }, [supabase]);

    // const { createEmployeeAction, updateEmployeeAction } = await import('@/app/actions');

    // ... onSubmit ...
    const onSubmit = async (data: EmployeeFormValues) => {
        setLoading(true);
        try {
            if (isEdit && employeeId) {
                await updateEmployeeAction(employeeId, data);
                await logAudit('UPDATE_EMPLOYEE', 'employee', employeeId, { updated_fields: Object.keys(data) });
            } else {
                const newEmp = await createEmployeeAction(data);
                await logAudit('CREATE_EMPLOYEE', 'employee', newEmp.id, { name: `${data.first_name} ${data.last_name}` });
            }
            if (isAdmin) {
                router.push('/employees');
            } else {
                // If self-update, stay on page or go to profile
                router.push('/profile');
            }
            router.refresh();
        } catch (error: any) {
            alert('Error saving employee: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const { role, employeeId: userEmployeeId } = useUserRole();
    const isAdmin = role === 'admin';
    const isSelf = userEmployeeId === employeeId;
    const canEditGeneral = isAdmin || (isEdit && isSelf);
    const canEditBank = isAdmin || (isEdit && isSelf); // Allow employees to add their bank details

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

                {/* Employee Code & Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Employee Code</label>
                    <input {...form.register('emp_code')} disabled={!isAdmin} placeholder="EMP001" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                {/* ... First Name, Last Name ... */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input {...form.register('first_name')} disabled={!canEditGeneral} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input {...form.register('last_name')} disabled={!canEditGeneral} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input {...form.register('email')} disabled={!isAdmin} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input {...form.register('phone')} disabled={!canEditGeneral} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input type="date" {...form.register('dob')} disabled={!canEditGeneral} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <input {...form.register('location')} disabled={!isAdmin} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                </div>

                {/* Restricted Fields */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select
                        {...form.register('department_id')}
                        disabled={!isAdmin}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Designation</label>
                    <select
                        {...form.register('designation_id')}
                        disabled={!isAdmin}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="">Select Designation</option>
                        {designations.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                    <input
                        {...form.register('joining_date')}
                        type="date"
                        disabled={!isAdmin}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        {...form.register('status')}
                        disabled={!isAdmin}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="on_leave">On Leave</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
            </div>

            {/* Bank Details Section */}
            <div className="border-t pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input {...form.register('bank_details.bank_name')} disabled={!canEditBank} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input {...form.register('bank_details.account_number')} disabled={!canEditBank} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">IFSC Code</label>
                        <input {...form.register('bank_details.ifsc')} disabled={!canEditBank} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">PAN Number</label>
                        <input {...form.register('bank_details.pan')} disabled={!canEditBank} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 disabled:bg-gray-100 disabled:text-gray-500" />
                    </div>
                </div>
            </div>

            {/* Documents Section */}
            {/* Documents Section Removed - Moved to dedicated 'Documents' tab */}
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
                    {isEdit ? (isSelf ? 'Update Profile' : 'Update Employee') : 'Create Employee'}
                </button>
            </div>
        </form>
    );
}
