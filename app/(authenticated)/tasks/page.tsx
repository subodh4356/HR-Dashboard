import TaskManager from '@/components/dashboard/TaskManager';
import PageHeader from '@/components/PageHeader';

export default function TasksPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Task Manager"
                description="Track HR operations, onboarding tasks, and reminders."
            />
            <TaskManager />
        </div>
    );
}
