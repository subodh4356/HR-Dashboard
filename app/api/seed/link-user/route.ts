import { createClient } from '@/lib/supabaseSSR'
import { createAdminClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Check if profile already exists
    const { data: existingProfile } = await adminClient
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .single()

    if (existingProfile) {
        return NextResponse.json({ message: 'User already linked', profile: existingProfile })
    }

    // Find employee by email
    const { data: employee } = await adminClient
        .from('employee')
        .select('id')
        .eq('email', user.email)
        .single()

    if (employee) {
        // Link to existing employee
        // FORCE ADMIN for specific user
        const role = user.email === 'try.subodhbaj@gmail.com' ? 'admin' : 'employee';

        const { error } = await adminClient
            .from('user_profile')
            .insert({
                id: user.id,
                employee_id: employee.id,
                role: role,
            })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Linked to existing employee', role })
    } else {
        // Optional: Auto-create employee for testing if requested, but safest to return 404
        // If logic requires creating admin if count=0?
        // Let's implement "First user is Admin" logic for convenience?
        const { count } = await adminClient.from('user_profile').select('*', { count: 'exact', head: true })
        if (count === 0) {
            // Create admin employee and profile
            const { data: newEmp, error: empError } = await adminClient
                .from('employee')
                .insert({
                    first_name: 'Admin',
                    last_name: 'User',
                    email: user.email,
                    department_id: null, // nullable?
                    designation_id: null,
                    status: 'active',
                    joining_date: new Date().toISOString()
                })
                .select()
                .single()

            if (empError) return NextResponse.json({ error: empError.message }, { status: 500 })

            // FORCE ADMIN for specific user or if count is 0
            const role = (user.email === 'try.subodhbaj@gmail.com' || count === 0) ? 'admin' : 'employee';

            const { error: profileError } = await adminClient
                .from('user_profile')
                .insert({
                    id: user.id,
                    employee_id: newEmp.id,
                    role: role
                })

            if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
            return NextResponse.json({ message: 'Created first admin user' })
        }

        return NextResponse.json({ message: 'No matching employee record found.' }, { status: 404 })
    }
}
