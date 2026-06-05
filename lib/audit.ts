import { createClient } from '@/lib/supabaseClient';

export async function logAudit(action: string, entity: string, entityId?: string, details?: any) {
    const supabase = createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('audit_log').insert({
            user_id: user?.id,
            action,
            entity,
            entity_id: entityId,
            details
        });
    } catch (error) {
        console.error("Failed to log audit", error);
    }
}
