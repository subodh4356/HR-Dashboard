import { createClient } from '@/lib/supabaseSSR';
import LeavePageClient from './client';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LeavePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 1. Get Profile & Role
    const { data: profile } = await supabase
        .from('user_profile')
        .select('employee_id, role')
        .eq('id', user.id)
        .maybeSingle();

    // Safety check for linking
    if (!profile?.employee_id) {
        // Even admins need an employee record for the code to allow them to "Apply" for leave
        // But we can fallback if not found? No, better to show error or empty.
        // return <div>User not linked to Employee Record. Contact Admin. (Run link_admin_to_employee.sql)</div>;
    }

    const isAdmin = profile?.role === 'admin';
    const myEmpId = profile?.employee_id;

    // 2. Fetch Data

    // A. My Requests (For everyone)
    let myRequests: any[] = [];
    if (myEmpId) {
        const { data } = await supabase
            .from('leave_request')
            .select('*, leave_policy!leave_request_leave_policy_id_fkey(name)')
            .eq('employee_id', myEmpId)
            .order('created_at', { ascending: false });
        if (data) myRequests = data;
    }

    // B. Admin Data (Pending & All)
    let pendingRequests: any[] = [];
    let allRequests: any[] = [];

    if (isAdmin) {
        // Pending
        const { data: pending, error: pendingError } = await supabase
            .from('leave_request')
            .select('*, leave_policy!leave_request_leave_policy_id_fkey(name), employee!leave_request_employee_id_fkey(first_name, last_name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        if (pendingError) {
            console.error("DEBUG: Error fetching pending requests:", pendingError);
        }

        if (pending) pendingRequests = pending;

        // All (Limit 50 or 100 for performance)
        const { data: all } = await supabase
            .from('leave_request')
            .select('*, leave_policy!leave_request_leave_policy_id_fkey(name), employee!leave_request_employee_id_fkey(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(50);
        if (all) allRequests = all;
    }

    return (
        <LeavePageClient
            myRequests={myRequests}
            pendingRequests={pendingRequests}
            allRequests={allRequests}
        />
    );
}
