'use client'

import React from 'react'
import { createClient } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [identifier, setIdentifier] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        let finalEmail = identifier.trim();

        // Check if identifier looks like an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail);

        if (!isEmail) {
            // It's likely an Employee Code ("EMP-1234")
            // Resolve to email via RPC
            const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_email_by_code', {
                code_input: finalEmail
            });

            if (rpcError || !resolvedEmail) {
                console.error("Code lookup failed:", rpcError);
                setError("Invalid Employee Code or Code not found.");
                setLoading(false);
                return;
            }
            finalEmail = resolvedEmail;
        }

        const { error: authError } = await supabase.auth.signInWithPassword({
            email: finalEmail,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
        } else {
            router.refresh()
            router.push('/dashboard')
        }
    }

    return (
        <div>
            <div className="mb-6 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900">Sign in</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Or{' '}
                    <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        create an account
                    </Link>
                </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                <div className="-space-y-px rounded-md shadow-sm">
                    <div>
                        <label htmlFor="identifier" className="sr-only">
                            Email address or Employee Code
                        </label>
                        <input
                            id="identifier"
                            name="identifier"
                            type="text"
                            required
                            className="relative block w-full rounded-t-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            placeholder="Email address or Employee Code (e.g. EMP-1234)"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
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
                            autoComplete="current-password"
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

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    )
}
