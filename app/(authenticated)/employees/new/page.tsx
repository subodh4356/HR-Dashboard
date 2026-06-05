import PageHeader from '@/components/PageHeader';
import EmployeeForm from '@/components/EmployeeForm';

export default function NewEmployeePage() {
    return (
        <div>
            <PageHeader title="Add New Employee" />
            <div className="max-w-2xl">
                <EmployeeForm />
            </div>
        </div>
    );
}
