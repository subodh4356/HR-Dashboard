import PolicyVault from '@/components/dashboard/PolicyVault';
import PageHeader from '@/components/PageHeader';

export default function DocumentsPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Policy & Document Vault"
                description="Central repository for all company policies and templates."
            />
            <PolicyVault />
        </div>
    );
}
