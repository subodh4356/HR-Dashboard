export default function KpiCard({ title, value, icon: Icon, change }: any) {
    return (
        <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        {Icon && <Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />}
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="truncate text-sm font-medium text-gray-500">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
            {change && (
                <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                        <span className={`font-medium ${change.type === 'positive' ? 'text-green-700' : 'text-red-700'}`}>
                            {change.value}
                        </span>
                        <span className="text-gray-500"> {change.text}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
