import { createClient } from "@/lib/supabaseSSR";
import EmployeeListClient from "./client";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const supabase = await createClient();

    // DEBUG: Check Session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) return <div>Access Denied</div>;

    const { data: profile } = await supabase.from('user_profile').select('role').eq('id', user.id).maybeSingle();

    if (profile?.role !== 'admin') {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
                <p className="text-gray-600">You do not have permission to view the employee list.</p>
            </div>
        )
    }

    const { data: employees, error } = await supabase
        .from("employee")
        .select(
            `
      id,
      first_name,
      last_name,
      email,
      department:department(name),
      designation:designation(name),
      status
    `
        )
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching employees RAW:", error);
        console.error("Error details:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        // In a real app, handle error gracefully
    }

    return (
        <EmployeeListClient initialEmployees={employees || []} />
    );
}
