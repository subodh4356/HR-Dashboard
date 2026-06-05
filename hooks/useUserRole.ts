import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export type UserRole = 'admin' | 'employee' | 'hr' | null;

export function useUserRole() {
    const [role, setRole] = useState<UserRole>(null);
    const [loading, setLoading] = useState(true);
    const [employeeId, setEmployeeId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchRole = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUser(user);
                // Fetch profile
                const { data: profile } = await supabase
                    .from('user_profile')
                    .select('role, employee_id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile) {
                    setRole(profile.role as UserRole);
                    setEmployeeId(profile.employee_id);
                }
            }
            setLoading(false);
        };
        fetchRole();
    }, []);

    return { role, loading, employeeId, user, isAdmin: role === 'admin' };
}
