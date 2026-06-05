import { createClient } from '@/lib/supabaseClient';

export async function createNotification(userId: string, title: string, message: string, link?: string) {
    const supabase = createClient();
    try {
        await supabase.from('notification').insert({
            user_id: userId,
            title,
            message,
            link
        });
    } catch (error) {
        console.error("Failed to create notification", error);
    }
}

export async function markNotificationAsRead(id: string) {
    const supabase = createClient();
    await supabase.from('notification').update({ is_read: true }).eq('id', id);
}
