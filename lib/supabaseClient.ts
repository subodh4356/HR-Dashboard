import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        // Return placeholder client to prevent build crash when env variables are not defined (e.g. in CI pipelines)
        return createBrowserClient(
            url || 'https://placeholder.supabase.co',
            anonKey || 'placeholder-key'
        );
    }

    return createBrowserClient(url, anonKey);
}
