import { createClient } from '@/lib/supabaseSSR'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Auto-create Employee and Profile if missing
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.email) {
                    const { createAdminClient } = await import('@/lib/supabaseServer');
                    const adminClient = createAdminClient();

                    // 1. Check/Create Employee
                    let { data: employee } = await adminClient
                        .from('employee')
                        .select('id')
                        .eq('email', user.email)
                        .single();

                    if (!employee) {
                        const nameParts = user.email.split('@')[0].split('.');
                        const firstName = nameParts[0] || 'New';
                        const lastName = nameParts[1] || 'User';

                        const { data: newEmp, error: createError } = await adminClient
                            .from('employee')
                            .insert({
                                first_name: firstName.charAt(0).toUpperCase() + firstName.slice(1),
                                last_name: lastName.charAt(0).toUpperCase() + lastName.slice(1),
                                email: user.email,
                                status: 'active',
                                joining_date: new Date().toISOString()
                            })
                            .select()
                            .single();

                        if (newEmp) employee = newEmp;
                        else console.error("Failed to auto-create employee:", createError);
                    }

                    // 2. Check/Create User Profile
                    if (employee) {
                        const { data: profile } = await adminClient
                            .from('user_profile')
                            .select('id')
                            .eq('id', user.id)
                            .single();

                        if (!profile) {
                            await adminClient.from('user_profile').insert({
                                id: user.id,
                                employee_id: employee.id,
                                role: 'employee' // Default role
                            });
                        }
                    }
                }
            } catch (err) {
                console.error("Auto-link failed in callback:", err);
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
