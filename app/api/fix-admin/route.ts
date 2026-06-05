import { createClient } from '@/lib/supabaseSSR'
import { createAdminClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== 'try.subodhbaj@gmail.com') {
        return NextResponse.json({ error: 'Unauthorized or not the target user' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Update user_profile to admin
    const { data, error } = await adminClient
        .from('user_profile')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Success! You are now an Admin.', user: data })
}
