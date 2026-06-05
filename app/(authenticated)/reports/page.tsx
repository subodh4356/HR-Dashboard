'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

export default function ReportsPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        onLeaveToday: 0,
    });
    const [deptData, setDeptData] = useState<any[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);

    const supabase = createClient();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        // 1. Headcount Stats
        const { count: total } = await supabase.from('employee').select('*', { count: 'exact', head: true });
        const { count: active } = await supabase.from('employee').select('*', { count: 'exact', head: true }).eq('status', 'active');

        // 2. Department Distribution
        // Note: Supabase JS doesn't do complex aggregation easily without RPC or Views. 
        // For MVP, we'll fetch all and aggregate in JS (safe for < 1000 employees).
        const { data: employees } = await supabase.from('employee').select('department_id, department(name)');

        const deptMap: Record<string, number> = {};
        employees?.forEach((e: any) => {
            const name = e.department?.name || 'Unassigned';
            deptMap[name] = (deptMap[name] || 0) + 1;
        });

        const dData = Object.keys(deptMap).map(key => ({ name: key, value: deptMap[key] }));
        setDeptData(dData);

        // 3. Attendance Trend (Mocked for MVP as we don't have historical aggregation yet)
        // In real app, we'd query attendance grouped by date.
        const mockTrend = [
            { date: 'Mon', present: 45, absent: 5 },
            { date: 'Tue', present: 48, absent: 2 },
            { date: 'Wed', present: 47, absent: 3 },
            { date: 'Thu', present: 46, absent: 4 },
            { date: 'Fri', present: 44, absent: 6 },
        ];
        setAttendanceTrend(mockTrend);

        setStats({
            totalEmployees: total || 0,
            activeEmployees: active || 0,
            onLeaveToday: 0 // Placeholder
        });
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader title="Reports & Analytics" description="Key workforce metrics" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Headcount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats.totalEmployees}</div>
                        <p className="text-xs text-slate-500 mt-1">{stats.activeEmployees} active</p>
                    </CardContent>
                </Card>
                {/* More cards can be added here */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Department Distribution */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Headcount by Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={deptData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {deptData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center mt-4">
                            {deptData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-sm text-slate-600">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name} ({entry.value})
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Trend */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Weekly Attendance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="present" fill="#4ade80" radius={[4, 4, 0, 0]} name="Present" />
                                <Bar dataKey="absent" fill="#f87171" radius={[4, 4, 0, 0]} name="Absent" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
