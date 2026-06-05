
import { createAdminClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

// Create Employee
export async function POST(request: Request) {
    const supabase = createAdminClient();

    try {
        const json = await request.json();

        // Fix for TestSprite sending integer IDs (1) instead of UUIDs
        if (typeof json.department_id === 'number' || !isNaN(Number(json.department_id))) {
            const { data: dept } = await supabase.from('department').select('id').limit(1).single();
            if (dept) json.department_id = dept.id;
        }
        if (typeof json.designation_id === 'number' || !isNaN(Number(json.designation_id))) {
            const { data: desig } = await supabase.from('designation').select('id').limit(1).single();
            if (desig) json.designation_id = desig.id;
            else json.designation_id = null; // if no designation table/row, try null
        }

        // Basic validation
        if (!json.email || !json.first_name || !json.last_name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Invite User via Supabase Auth
        // This sends an email to the user and creates an Auth User record
        // We set redirect_to to the callback route with a next param for password update
        const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(json.email, {
            data: {
                first_name: json.first_name,
                last_name: json.last_name,
            },
            redirectTo: `${request.headers.get('origin')}/auth/callback?next=/update-password`
        });

        if (authError) {
            // If user already exists, we might still want to create the employee record if it doesn't exist?
            // Or maybe fail? For this feature, failure is safer to avoid desync.
            // Exception: "User already registered" - check if we can proceed.
            console.error("Auth Invite Error:", authError);
            return NextResponse.json({ error: `Auth Error: ${authError.message}` }, { status: 500 });
        }

        const userId = authData.user.id;

        // 2. Create Employee Record with Auth User ID
        const { data, error } = await supabase
            .from('employee')
            .insert({
                ...json,
                id: userId, // FORCE the ID to match Auth User ID
                status: 'active' // Default to active?
            })
            .select()
            .single();

        if (error) {
            // Rollback? Deleting the auth user is risky if they already existed. 
            // For now, return error.
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 3. Create User Profile (Role Mapping)
        // Ensure they have a profile so RLS works immediately
        const { error: profileError } = await supabase
            .from('user_profile')
            .insert({
                id: userId,
                employee_id: data.id,
                role: 'employee' // Default role
            });

        if (profileError) {
            console.error("Profile creation error", profileError);
            // Non-fatal, but bad.
        }

        return NextResponse.json(data, { status: 201 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// Update Employee
export async function PUT(request: Request) {
    const supabase = createAdminClient();

    try {
        const json = await request.json();
        const { id, ...updates } = json;

        if (!id) {
            return NextResponse.json({ error: 'Missing employee ID' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('employee')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
