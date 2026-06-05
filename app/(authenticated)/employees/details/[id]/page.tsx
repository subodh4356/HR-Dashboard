import { createClient } from '@/lib/supabaseSSR';
import EmployeeDetailClient from '../../[id]/client'; // Import from previous location or move client too
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: employee, error } = await supabase
        .from('employee')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !employee) {
        console.error("Employee Detail 404 Debug:", { id, error, employee });
        return (
            <div className="p-8 text-red-600 border border-red-600 rounded bg-red-50">
                <h1 className="text-2xl font-bold mb-4">Debug Error State (New Route)</h1>
                <p><strong>ID:</strong> {id}</p>
                <p><strong>Error:</strong> {JSON.stringify(error)}</p>
                <p><strong>Employee Data:</strong> {JSON.stringify(employee)}</p>
            </div>
        );
    }

    const { data: documents } = await supabase
        .from('file_ref')
        .select('*')
        .eq('entity_id', id)
        .eq('entity_type', 'employee');

    return <EmployeeDetailClient employee={employee} documents={documents || []} />;
}
