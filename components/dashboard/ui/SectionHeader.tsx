'use client';

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export default function SectionHeader({ title, description, action }: SectionHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
}
