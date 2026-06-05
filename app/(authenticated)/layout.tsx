import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import MobileNav from './MobileNav';

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar - Desktop (Static) */}
            <div className="hidden md:block w-64 bg-gray-900">
                <Sidebar />
            </div>

            {/* Mobile Navigation & Sidebar Drawer */}
            <MobileNav />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <TopHeader />
                <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
