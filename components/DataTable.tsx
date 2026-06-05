export type Column<T> = {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string; // Add className to Column type
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
};

export default function DataTable<T extends { id: string | number }>({
    columns,
    data,
    onRowClick,
    isLoading,
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full animate-pulse space-y-4">
                <div className="h-10 w-full rounded bg-gray-200"></div>
                <div className="h-10 w-full rounded bg-gray-200"></div>
                <div className="h-10 w-full rounded bg-gray-200"></div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${column.className || ''}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No data found
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIdx) => (
                                <tr
                                    key={item.id}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={
                                        onRowClick
                                            ? 'cursor-pointer hover:bg-gray-50 transition-colors'
                                            : ''
                                    }
                                >
                                    {columns.map((column, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                                        >
                                            {column.cell
                                                ? column.cell(item)
                                                : (item[column.accessorKey as keyof T] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
