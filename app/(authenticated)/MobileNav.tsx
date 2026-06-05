'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function MobileNav() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            <div className="md:hidden flex items-center bg-white p-4 shadow-sm z-30">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="rounded-md p-2 hover:bg-gray-100 focus:outline-none"
                >
                    <Menu className="h-6 w-6 text-gray-700" />
                </button>
                <span className="ml-4 text-lg font-bold text-gray-900">HR Portal</span>
            </div>

            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
        </>
    );
}
