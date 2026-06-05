import { createClient } from '@/lib/supabaseSSR'
import { createAdminClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated. Please log in first.' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // 1. Check if user_profile exists
    let { data: profile, error: profileError } = await adminClient
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .single()

    // 2. Check if linked
    if (profile && profile.employee_id) {
        return NextResponse.json({ message: 'Profile is already correctly linked to an employee record.', profile })
    }

    // 3. Find Employee by Email
    const { data: employee } = await adminClient
        .from('employee')
        .select('*')
        .eq('email', user.email)
        .single()

    let empId = employee?.id
    let orgId = employee?.organisation_id

    if (!empId) {
        // Create Employee record if missing
        const fullName = user.user_metadata?.full_name || '';
        const firstName = fullName.split(' ')[0] || 'Employee';
        const lastName = fullName.split(' ').slice(1).join(' ') || 'User';

        const { data: newEmp, error: empError } = await adminClient
            .from('employee')
            .insert({
                first_name: firstName,
                last_name: lastName,
                email: user.email,
                status: 'active',
                joining_date: new Date().toISOString()
            })
            .select() // Need to select to get ID
            .single()

        if (empError) {
            return NextResponse.json({ error: 'Failed to create employee record: ' + empError.message }, { status: 500 })
        }
        empId = newEmp.id
        orgId = newEmp.organisation_id
    }

    // 4. Create or Update user_profile
    if (!profile) {
        const { data: newProfile, error: createError } = await adminClient
            .from('user_profile')
            .insert({
                id: user.id,
                employee_id: empId,
                role: 'employee',
                organisation_id: orgId
            })
            .select()
            .single()

        if (createError) {
            return NextResponse.json({ error: 'Failed to create profile: ' + createError.message }, { status: 500 })
        }
        profile = newProfile
    } else {
        const { data: updatedProfile, error: updateError } = await adminClient
            .from('user_profile')
            .update({ 
                employee_id: empId,
                organisation_id: orgId
            })
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) {
            return NextResponse.json({ error: 'Failed to link profile: ' + updateError.message }, { status: 500 })
        }
        profile = updatedProfile
    }

    return NextResponse.json({
        message: 'Successfully fixed account! You are now linked to an employee record.',
        profile,
        employee_id: empId
    })
}
