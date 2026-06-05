import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const isInvalidUrl = !url || url === 'undefined' || url === 'null' || url.trim() === '';
    const isInvalidKey = !anonKey || anonKey === 'undefined' || anonKey === 'null' || anonKey.trim() === '';

    if (isInvalidUrl || isInvalidKey) {
        // Return placeholder client to prevent build crash when env variables are not defined (e.g. in CI pipelines)
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder-key'
        );
    }

    return createBrowserClient(url, anonKey);
}
