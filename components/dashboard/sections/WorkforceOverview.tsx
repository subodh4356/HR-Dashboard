'use client';

import SectionHeader from '../ui/SectionHeader';
import BarChartComponent from '../charts/BarChartComponent';
import PieChartComponent from '../charts/PieChartComponent';
import DonutChartComponent from '../charts/DonutChartComponent';

// Mock Data
const deptData = [
    { name: 'Engineering', count: 450 },
    { name: 'Sales', count: 320 },
    { name: 'Marketing', count: 210 },
    { name: 'HR', count: 85 },
    { name: 'Finance', count: 120 },
    { name: 'Support', count: 109 },
];

const genderData = [
    { name: 'Male', value: 750, fill: '#3b82f6' },
    { name: 'Female', value: 544, fill: '#ec4899' },
];

const typeData = [
    { name: 'Full-time', value: 1100 },
    { name: 'Contract', value: 150 },
    { name: 'Intern', value: 44 },
];

const locationData = [
    { name: 'New York', count: 500 },
    { name: 'London', count: 350 },
    { name: 'Bangalore', count: 444 },
];

export default function WorkforceOverview() {
    return (
        <div className="mb-8">
            <SectionHeader title="Workforce Overview" description="Distribution across departments, gender, and employment type" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <BarChartComponent
                        title="Employee Count by Department"
                        data={deptData}
                        xKey="name"
                        yKey="count"
                        colors={['#6366f1']}
                    />
                </div>
                <PieChartComponent
                    title="Gender Ratio"
                    data={genderData}
                    nameKey="name"
                    dataKey="value"
                    colors={['#3b82f6', '#ec4899']}
                />
                <DonutChartComponent
                    title="Employment Type"
                    data={typeData}
                    nameKey="name"
                    dataKey="value"
                />
                <BarChartComponent
                    title="Employees by Location"
                    data={locationData}
                    xKey="name"
                    yKey="count"
                    colors={['#10b981']}
                />
            </div>
        </div>
    );
}
