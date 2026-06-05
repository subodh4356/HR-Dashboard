import { createClient } from '@/lib/supabaseSSR';

export const dynamic = 'force-dynamic';

export default async function DebugEmpPage() {
    const supabase = await createClient();

    // Check Env
    const envCheck = {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };

    // Fetch All Employees
    const { data: employees, error } = await supabase
        .from('employee')
        .select('id, first_name, email')
        .limit(10);

    return (
        <div className="p-8 font-mono text-sm">
            <h1 className="text-xl font-bold mb-4">Debug Diagnostics</h1>

            <div className="mb-8 p-4 bg-gray-100 rounded">
                <h2 className="font-bold">Environment</h2>
                <pre>{JSON.stringify(envCheck, null, 2)}</pre>
            </div>

            <div className="mb-8 p-4 bg-gray-100 rounded">
                <h2 className="font-bold">Supabase Query Result</h2>
                {error ? (
                    <div className="text-red-600">
                        Error: {error.message}
                        <br />
                        Code: {error.code}
                        <br />
                        Details: {error.details}
                    </div>
                ) : (
                    <div>
                        <p className="text-green-600 mb-2">Success! Database Connection Verified.</p>
                        <p className="mb-4 text-gray-700">
                            Below are valid employees. Click the "Try New Route" link to test the new path.
                        </p>
                        <ul className="space-y-4">
                            {employees.map(emp => (
                                <li key={emp.id} className="border-b pb-2 bg-white p-2 rounded shadow-sm">
                                    <div className="font-bold">{emp.first_name}</div>
                                    <div className="text-xs text-gray-500">ID: {emp.id}</div>
                                    <div className="text-xs text-gray-500">Email: {emp.email}</div>
                                    <div className="mt-2 flex gap-2">
                                        <a href={`/employees/details/${emp.id}`} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            Try New Route (/details/...)
                                        </a>
                                        <span className="text-gray-400 text-xs self-center">vs</span>
                                        <a href={`/employees/${emp.id}`} className="text-red-400 underline hover:text-red-600 text-xs self-center">
                                            Old Route (Broken)
                                        </a>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
