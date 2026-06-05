import { createClient } from '@/lib/supabaseSSR';
import EmployeeDetailClient from './client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    // console.log("EmployeeDetails Page Hit: ID =", id);
    const supabase = await createClient();

    // 1. Security Check: Only Admin or Self can view
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return notFound();

    // Fetch user role
    const { data: userProfile } = await supabase
        .from('user_profile')
        .select('role, employee_id')
        .eq('id', user.id)
        .single();

    // Strict Access Control
    const isAdmin = userProfile?.role === 'admin';
    const isSelf = userProfile?.employee_id === id;

    if (!isAdmin && !isSelf) {
        return (
            <div className="p-8 text-center text-red-600">
                <h2 className="text-xl font-bold">Access Denied</h2>
                <p>You do not have permission to view this profile.</p>
            </div>
        );
    }

    const { data: employee, error } = await supabase
        .from('employee')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !employee) {
        console.error("Employee Detail 404 Debug:", { id, error, employee });
        return (
            <div className="p-8 text-red-600 border border-red-600 rounded bg-red-50">
                <h1 className="text-2xl font-bold mb-4">Debug Error State</h1>
                <p><strong>ID:</strong> {id}</p>
                <p><strong>Error:</strong> {JSON.stringify(error)}</p>
                <p><strong>Employee Data:</strong> {JSON.stringify(employee)}</p>
                <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            </div>
        );
    }

    // Fetched client-side now via EmployeeDocuments
    const documents: any[] = [];

    return <EmployeeDetailClient employee={employee} documents={documents} />;
}
