import ComplianceTracker from '@/components/dashboard/ComplianceTracker';
import PageHeader from '@/components/PageHeader';

export default function CompliancePage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Compliance Tracker"
                description="Monitor statutory compliance, renewals, and legal requirements."
            />
            <ComplianceTracker />
        </div>
    );
}
