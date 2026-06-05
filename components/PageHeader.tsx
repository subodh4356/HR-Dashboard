'use client';
import { useRouter } from 'next/navigation';

export default function PageHeader({
    title,
    description,
    actionLabel,
    actionUrl,
}: {
    title: string;
    description?: string;
    actionLabel?: string;
    actionUrl?: string;
}) {
    const router = useRouter();

    return (
        <div className="mb-6 flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                    <p className="mt-1 text-sm text-gray-500">{description}</p>
                )}
            </div>
            {actionLabel && actionUrl && (
                <button
                    onClick={() => router.push(actionUrl)}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
