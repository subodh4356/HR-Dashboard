'use client';

import SectionHeader from '../ui/SectionHeader';
import SmallTable from '../ui/SmallTable';
import StatusIndicator, { Status } from '../ui/StatusIndicator';

const pendingDocs = [
    { name: 'John Doe', document: 'Passport', status: 'Pending' },
    { name: 'Jane Smith', document: 'Tax Form', status: 'Missing' },
    { name: 'Mike Ross', document: 'NDA', status: 'Expired' },
];

const complianceStatus = [
    { item: 'PF Remittance', status: 'success', date: 'Oct 15' },
    { item: 'ESI Contribution', status: 'success', date: 'Oct 15' },
    { item: 'Professional Tax', status: 'warning', date: 'Due Oct 30' },
    { item: 'TDS Filing', status: 'error', date: 'Overdue' },
];

const grievances = [
    { id: '#GR-102', subject: 'Seating Issue', status: 'Open' },
    { id: '#GR-101', subject: 'Salary Discrepancy', status: 'Resolved' },
];

const docColumns = [
    { key: 'name', header: 'Employee' },
    { key: 'document', header: 'Document' },
    {
        key: 'status',
        header: 'Status',
        render: (val: string) => (
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${val === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                {val}
            </span>
        )
    },
];

const grievanceColumns = [
    { key: 'id', header: 'ID' },
    { key: 'subject', header: 'Subject' },
    {
        key: 'status',
        header: 'Status',
        render: (val: string) => (
            <StatusIndicator status={val === 'Resolved' ? 'success' : 'warning'} text={val} />
        )
    }
];

export default function ComplianceDocumentation() {
    return (
        <div className="mb-8">
            <SectionHeader title="Compliance & Documentation" description="Legal requirements and grievance handling" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                <SmallTable
                    title="Pending Documents"
                    data={pendingDocs}
                    columns={docColumns}
                />

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Statutory Compliance</h3>
                    <div className="space-y-4">
                        {complianceStatus.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="font-medium text-slate-700">{item.item}</span>
                                <div className="flex flex-col items-end gap-1">
                                    <StatusIndicator status={item.status as Status} pulsate={item.status === 'error'} />
                                    <span className="text-xs text-slate-400">{item.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <SmallTable
                    title="Recent Grievances"
                    data={grievances}
                    columns={grievanceColumns}
                />

            </div>
        </div>
    );
}
