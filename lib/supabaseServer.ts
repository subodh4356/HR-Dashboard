import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isInvalidUrl = !url || url === 'undefined' || url === 'null' || url.trim() === '';
    const isInvalidKey = !serviceRoleKey || serviceRoleKey === 'undefined' || serviceRoleKey === 'null' || serviceRoleKey.trim() === '';

    return createSupabaseClient(
        isInvalidUrl ? 'https://placeholder.supabase.co' : url,
        isInvalidKey ? 'placeholder-key' : serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    )
}
