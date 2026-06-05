import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Standard client that respects user cookies and RLS policies
export async function createClient() {
    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const isInvalidUrl = !url || url === 'undefined' || url === 'null' || url.trim() === '';
    const isInvalidKey = !anonKey || anonKey === 'undefined' || anonKey === 'null' || anonKey.trim() === '';

    return createServerClient(
        isInvalidUrl ? 'https://placeholder.supabase.co' : url,
        isInvalidKey ? 'placeholder-key' : anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Safe to ignore if called from a Server Component
                    }
                },
            },
        }
    )
}

// Admin client that uses the service role key to bypass RLS policies
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
