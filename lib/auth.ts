import { createClient } from './supabaseSSR'

export async function getUser() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getUserProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // We assume user_profile table exists as per prompt
    const { data: profile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
}
