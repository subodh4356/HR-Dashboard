'use client';

interface Column {
    key: string;
    header: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface SmallTableProps {
    data: any[];
    columns: Column[];
    title?: string;
    maxHeight?: string;
}

export default function SmallTable({ data, columns, title, maxHeight = '300px' }: SmallTableProps) {
    return (
        <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
            {title && <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>}
            <div className="overflow-auto custom-scrollbar" style={{ maxHeight }}>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} className="px-4 py-3 font-medium rounded-t-lg">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-0">
                                {columns.map((col) => (
                                    <td key={`${rowIndex}-${col.key}`} className="px-4 py-3 text-slate-700">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="text-center py-8 text-slate-400">No data available</div>
                )}
            </div>
        </div>
    );
}
