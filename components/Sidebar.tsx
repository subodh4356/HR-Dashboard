'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, ClipboardList, Briefcase, LayoutDashboard, Settings, LogOut, User, Award, GraduationCap, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { role, loading } = useUserRole();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        router.refresh();
        router.push('/login');
    };

    const adminNavigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Employees', href: '/employees', icon: Users },
        { name: 'Compliance', href: '/compliance', icon: ClipboardList },
        { name: 'Documents', href: '/documents', icon: ClipboardList },
        { name: 'Tasks', href: '/tasks', icon: ClipboardList },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Leave', href: '/leave', icon: ClipboardList },
        { name: 'Recruitment', href: '/recruitment', icon: Briefcase },
        { name: 'Payroll', href: '/payroll', icon: ClipboardList },
        { name: 'Performance', href: '/performance', icon: Award },
        { name: 'Training', href: '/training', icon: GraduationCap },
        { name: 'Reports', href: '/reports', icon: ClipboardList },
        { name: 'Audit Logs', href: '/admin/audit', icon: Shield },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    const employeeNavigation = [
        { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Attendance', href: '/attendance', icon: Calendar },
        { name: 'My Leave', href: '/leave', icon: ClipboardList },
        { name: 'My Performance', href: '/performance', icon: Award },
        { name: 'My Training', href: '/training', icon: GraduationCap },
        { name: 'My Payslips', href: '/payroll', icon: ClipboardList },
        { name: 'My Profile', href: '/profile', icon: User },
    ];

    const navigation = role === 'admin' ? adminNavigation : employeeNavigation;

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white relative">
            {/* Close Button for Mobile/Drawer Mode */}
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white sm:hidden"
                >
                    <span className="sr-only">Close sidebar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold">
                    {loading ? '...' : (role === 'admin' ? 'HR Portal' : 'Employee Portal')}
                </h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {!loading && navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <item.icon
                                className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                                    }`}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-gray-800 p-4">
                <button
                    onClick={handleSignOut}
                    className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <LogOut
                        className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-300"
                        aria-hidden="true"
                    />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
