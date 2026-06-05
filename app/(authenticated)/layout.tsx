'use client';

import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar - Desktop (Static) */}
            <div className="hidden md:block w-64 bg-gray-900">
                <Sidebar />
            </div>

            {/* Sidebar - Mobile (Drawer) */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Overlay for mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header / Toggle */}
                <div className="md:hidden flex items-center bg-white p-4 shadow-sm z-30">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="rounded-md p-2 hover:bg-gray-100 focus:outline-none"
                    >
                        <Menu className="h-6 w-6 text-gray-700" />
                    </button>
                    <span className="ml-4 text-lg font-bold text-gray-900">HR Portal</span>
                </div>

                <TopHeader />
                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
