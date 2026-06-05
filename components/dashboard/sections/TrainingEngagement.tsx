'use client';

import SectionHeader from '../ui/SectionHeader';
import BarChartComponent from '../charts/BarChartComponent';
import DonutChartComponent from '../charts/DonutChartComponent';
import SmallTable from '../ui/SmallTable';

const trainingHours = [
    { name: 'Tech', count: 120 },
    { name: 'Soft Skills', count: 80 },
    { name: 'Compliance', count: 45 },
    { name: 'Leadership', count: 30 },
];

const feedbackData = [
    { name: 'Positive', value: 85 },
    { name: 'Needs Improvement', value: 15 },
];

const engagementCalendar = [
    { event: 'Team Lunch', date: 'Oct 15', status: 'Upcoming' },
    { event: 'Hackathon', date: 'Oct 22', status: 'Planning' },
    { event: 'Town Hall', date: 'Oct 30', status: 'Scheduled' },
];

const columns = [
    { key: 'event', header: 'Event' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status' },
];

export default function TrainingEngagement() {
    return (
        <div className="mb-8">
            <SectionHeader title="Training & Engagement" description="Skill development and cultural activities" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                    <BarChartComponent
                        title="Training Hours per Category"
                        data={trainingHours}
                        xKey="name"
                        yKey="count"
                        colors={['#8b5cf6']}
                    />
                </div>

                {/* KPI Card for Employees Trained */}
                <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl p-6 shadow-lg text-white flex flex-col justify-center items-center">
                    <h3 className="text-white/80 font-medium mb-2">Employees Trained This Month</h3>
                    <div className="text-5xl font-bold">142</div>
                    <div className="mt-4 bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        Target: 150
                    </div>
                </div>

                <DonutChartComponent
                    title="Training Feedback"
                    data={feedbackData}
                    nameKey="name"
                    dataKey="value"
                    colors={['#10b981', '#f59e0b']}
                />

                <div className="lg:col-span-2">
                    <SmallTable
                        title="Engagement Calendar"
                        data={engagementCalendar}
                        columns={columns}
                    />
                </div>
            </div>
        </div>
    );
}
