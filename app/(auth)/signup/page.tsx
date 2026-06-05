'use client'

import React from 'react'
import { createClient } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [message, setMessage] = React.useState<string | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            // 1. Verify Employee Email and Auto-Create Employee Record if needed
            // Call check_employee_by_email_on_signup RPC function (runs as SECURITY DEFINER to bypass guest RLS safely)
            const { data: checkData, error: rpcError } = await supabase.rpc('check_employee_by_email_on_signup', {
                email_input: email.trim()
            });

            if (rpcError || !checkData || checkData.length === 0) {
                console.error("RPC error or empty:", rpcError);
                throw new Error("Unable to verify email account registration. Please try again.");
            }

            const { employee_id, is_claimed } = checkData[0] as any;

            if (is_claimed) {
                throw new Error("This email has already been registered to an active profile.");
            }

            // 2. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })

            if (authError) throw authError;

            if (authData.user) {
                // 3. Link Profile immediately
                const { error: profileError } = await supabase.rpc('create_profile_on_signup', {
                    user_id: authData.user.id,
                    user_email: email.trim(),
                    emp_id: employee_id
                });

                if (profileError) {
                    console.error("Profile linking failed:", profileError);
                }

                setMessage('Account created! Check your email for confirmation.')
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <div className="mb-6 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Create an account</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign in
                    </Link>
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                <div className="-space-y-px rounded-md shadow-sm">
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            Email address
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="relative block w-full rounded-t-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            className="relative block w-full rounded-b-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
                        {message}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign up
                    </button>
                </div>
            </form>
        </div>
    )
}
