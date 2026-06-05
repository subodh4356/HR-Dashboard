'use client';

import { useEffect, useState } from 'react';
import { 
    Bell, 
    Check, 
    UserCheck, 
    Calendar, 
    ClipboardList, 
    Award, 
    CheckCircle, 
    AlertTriangle 
} from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    link?: string;
}

export default function NotificationsPopover() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('notification')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notification-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification',
                },
                (payload) => {
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const markAsRead = async (id: string, link?: string) => {
        await supabase.from('notification').update({ is_read: true }).eq('id', id);

        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (link) {
            setOpen(false);
            router.push(link);
        }
    };

    const markAllRead = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('notification').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const formatNotificationDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, h:mm a');
        } catch (e) {
            return dateString;
        }
    };

    const getNotificationIcon = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('employee')) {
            return <UserCheck className="h-4 w-4 text-emerald-600" />;
        }
        if (t.includes('leave')) {
            return <Calendar className="h-4 w-4 text-sky-650" />;
        }
        if (t.includes('task')) {
            return <ClipboardList className="h-4 w-4 text-amber-600" />;
        }
        if (t.includes('course') || t.includes('learning') || t.includes('training') || t.includes('completed!')) {
            return <Award className="h-4 w-4 text-violet-600" />;
        }
        if (t.includes('performance') || t.includes('appraisal') || t.includes('evaluation')) {
            return <CheckCircle className="h-4 w-4 text-rose-600" />;
        }
        return <Bell className="h-4 w-4 text-slate-500" />;
    };

    const getNotificationIconBg = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('employee')) return 'bg-emerald-50 border border-emerald-100/50';
        if (t.includes('leave')) return 'bg-sky-50 border border-sky-100/50';
        if (t.includes('task')) return 'bg-amber-50 border border-amber-100/50';
        if (t.includes('course') || t.includes('learning') || t.includes('training') || t.includes('completed!')) return 'bg-violet-50 border border-violet-100/50';
        if (t.includes('performance') || t.includes('appraisal') || t.includes('evaluation')) return 'bg-rose-50 border border-rose-100/50';
        return 'bg-slate-50 border border-slate-100/50';
    };

    if (!mounted) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100/80 rounded-full transition-colors p-2 h-10 w-10">
                    <Bell className="h-[22px] w-[22px] text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent 
                className="w-96 p-0 bg-white border border-slate-200/80 shadow-2xl rounded-xl overflow-hidden z-[9999]" 
                align="end"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="bg-indigo-100 text-indigo-750 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={markAllRead} 
                            className="text-xs text-indigo-650 hover:text-indigo-850 hover:bg-indigo-50/50 h-auto px-2 py-1 rounded font-medium transition-colors"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Content */}
                <ScrollArea className="max-h-[360px] min-h-[100px]">
                    {notifications.length === 0 ? (
                        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mb-3">
                                <Bell className="h-5 w-5 text-slate-400" />
                            </div>
                            <h4 className="text-sm font-medium text-slate-700">All caught up!</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">You have no new notifications at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid divide-y divide-slate-100 bg-white">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-slate-50/70 active:bg-slate-100/50 transition-all cursor-pointer flex gap-3.5 relative items-start",
                                        !notification.is_read ? "border-l-4 border-indigo-650 bg-indigo-50/15" : "border-l-4 border-transparent"
                                    )}
                                    onClick={() => markAsRead(notification.id, notification.link)}
                                >
                                    {/* Icon Badge */}
                                    <div className={cn(
                                        "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center shadow-sm",
                                        getNotificationIconBg(notification.title)
                                    )}>
                                        {getNotificationIcon(notification.title)}
                                    </div>

                                    {/* Body */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-1">
                                            <p className={cn(
                                                "text-xs font-semibold leading-tight", 
                                                !notification.is_read ? "text-slate-905 font-bold" : "text-slate-700"
                                            )}>
                                                {notification.title}
                                            </p>
                                            
                                            {/* Quick Mark Read Button */}
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-indigo-50 text-indigo-600 transition-colors -mt-1 -mr-1"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 leading-normal pr-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                                            {formatNotificationDate(notification.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

