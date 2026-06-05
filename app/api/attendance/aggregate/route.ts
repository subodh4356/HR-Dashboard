import { createAdminClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Verify secret token if needed (CRON job auth)
    // For MVP, we assume this is called by a secure scheduler or manually by admin

    const supabase = createAdminClient();
    const today = new Date().toISOString().split('T')[0];

    try {
        // 1. Get all active employees
        const { data: employees, error: empError } = await supabase
            .from('employee')
            .select('id')
            .eq('status', 'active');

        if (empError) throw empError;
        if (!employees || employees.length === 0) {
            return NextResponse.json({ message: 'No active employees found' });
        }

        // 2. Get attendance records for today
        const { data: attendance, error: attError } = await supabase
            .from('attendance')
            .select('employee_id, status')
            .eq('date', today);

        if (attError) throw attError;

        // 3. Calculate Stats
        const totalEmployees = employees.length;
        const presentCount = attendance ? attendance.filter(a => a.status === 'present').length : 0;
        const absentCount = totalEmployees - presentCount; // Simple logic for MVP (ignoring leave)

        // 4. Log aggregate to audit log or a dedicated 'daily_stats' table if it existed
        // For MVP, we'll just log to Audit Log
        const { error: logError } = await supabase.from('audit_log').insert({
            action: 'AGGREGATE_ATTENDANCE',
            entity: 'system',
            entity_id: 'daily_job',
            actor_id: 'system',
            payload: {
                date: today,
                total: totalEmployees,
                present: presentCount,
                absent: absentCount
            }
        });

        if (logError) throw logError;

        return NextResponse.json({
            success: true,
            stats: {
                total: totalEmployees,
                present: presentCount,
                absent: absentCount
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
