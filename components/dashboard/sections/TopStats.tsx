'use client';

import { Users, UserPlus, UserMinus, TrendingDown, Briefcase, Calendar, IndianRupee } from 'lucide-react';
import KpiCard from '../ui/KpiCard';

export default function TopStats() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard
                title="Total Employees"
                value="1,294"
                icon={Users}
                trend="+12%"
                trendUp={true}
                subtext="vs last month"
                color="blue"
            />
            <KpiCard
                title="New Joiners"
                value="42"
                icon={UserPlus}
                trend="+5"
                trendUp={true}
                subtext="this month"
                color="green"
            />
            <KpiCard
                title="Employees Left"
                value="8"
                icon={UserMinus}
                trend="-2"
                trendUp={true} // Green because lower is better for attrition? Usually "Up" means direction. Let's assume green color means good.
                subtext="this month"
                color="red"
            />
            <KpiCard
                title="Attrition Rate"
                value="2.4%"
                icon={TrendingDown}
                trend="-0.5%"
                trendUp={true} // Good direction
                subtext="avg. this year"
                color="orange"
            />
            <KpiCard
                title="Open Positions"
                value="18"
                icon={Briefcase}
                subtext="Across 4 depts"
                color="purple"
            />
            <KpiCard
                title="Avg. Attendance"
                value="96%"
                icon={Calendar}
                trend="+1%"
                trendUp={true}
                subtext="Current Month"
                color="green"
            />
            <KpiCard
                title="Payroll Cost"
                value="₹42L"
                icon={IndianRupee}
                subtext="Estimated Sep"
                color="blue"
            />
        </div>
    );
}
