'use client';

import NotificationsPopover from '@/components/NotificationsPopover';
import { useUserRole } from '@/hooks/useUserRole';
import { User } from 'lucide-react';

export default function TopHeader() {
    const { role, loading } = useUserRole();

    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
            {/* Left side: Breadcrumb or Title (optional, layout mostly handles it) */}
            <div className="flex items-center gap-4 md:hidden">
                {/* Mobile menu trigger is in layout, logic simplified here */}
                <span className="font-semibold text-gray-700">HR Portal</span>
            </div>

            <div className="hidden md:block">
                {/* Spacer or search bar if needed */}
            </div>

            {/* Right side: Actions */}
            <div className="flex items-center gap-4">
                <NotificationsPopover />

                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                            {loading ? '...' : role}
                        </p>
                        <p className="text-xs text-gray-500">
                            {role === 'admin' ? 'Administrator' : 'Employee'}
                        </p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-600">
                        <User className="h-5 w-5" />
                    </div>
                </div>
            </div>
        </header>
    );
}
