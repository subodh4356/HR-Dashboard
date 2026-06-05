'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Plus, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import StatusIndicator from './ui/StatusIndicator';

interface HRTask {
    id: string;
    title: string;
    description?: string;
    assigned_to?: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    due_date?: string;
    created_at: string;
}

export default function TaskManager() {
    const supabase = createClient();
    const [tasks, setTasks] = useState<HRTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Quick Add Form
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Medium' | 'High'>('Medium');

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('hr_tasks')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setTasks(data as HRTask[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleQuickAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const { error } = await supabase.from('hr_tasks').insert({
            title: newTaskTitle,
            priority: newTaskPriority,
            status: 'Pending',
            due_date: new Date().toISOString(), // Default to today for now
        });

        if (!error) {
            setNewTaskTitle('');
            setIsAdding(false);
            fetchTasks();
        }
    };

    const toggleStatus = async (task: HRTask) => {
        const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
        // Optimistic update
        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        await supabase.from('hr_tasks').update({ status: newStatus }).eq('id', task.id);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">

            {/* Task List / Kanban Column - Doing simpler list for MVP */}
            <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                    >
                        <Plus size={16} /> New Task
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleQuickAdd} className="bg-white p-4 rounded shadow-sm border mb-4 flex gap-2">
                        <input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="flex-1 border-b focus:border-blue-500 outline-none px-2 py-1"
                            autoFocus
                        />
                        <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                            className="text-sm text-gray-500 border-none outline-none"
                        >
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                        <button type="submit" className="text-blue-600 text-sm font-medium">Add</button>
                    </form>
                )}

                <div className="bg-white rounded-lg shadow-sm border min-h-[400px]">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>
                    ) : tasks.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">No tasks pending. Great job!</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {tasks.map(task => (
                                <li key={task.id} className={cn(
                                    "p-4 hover:bg-gray-50 transition flex items-center gap-3 group",
                                    task.status === 'Completed' ? 'opacity-50' : ''
                                )}>
                                    <button
                                        onClick={() => toggleStatus(task)}
                                        className={cn(
                                            "flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition",
                                            task.status === 'Completed' ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-blue-500"
                                        )}
                                    >
                                        {task.status === 'Completed' && <CheckCircle2 size={14} />}
                                    </button>

                                    <div className="flex-1">
                                        <p className={cn("text-sm font-medium text-gray-900", task.status === 'Completed' && "line-through")}>
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            {task.due_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {format(new Date(task.due_date), 'MMM dd')}
                                                </span>
                                            )}
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                                                task.priority === 'High' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                            )}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="opacity-0 group-hover:opacity-100 transition">
                                        {/* Place for Delete/Edit buttons */}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Side Panel - Recent Activity or Stats */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="font-semibold text-lg opacity-90">Productivity</h3>
                    <div className="mt-4 flex items-end gap-2">
                        <span className="text-4xl font-bold">{tasks.filter(t => t.status === 'Completed').length}</span>
                        <span className="text-sm opacity-75 mb-1">tasks completed</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-4">
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">Pending High Priority</h3>
                    <ul className="space-y-2">
                        {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3).map(t => (
                            <li key={t.id} className="text-sm text-gray-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                {t.title}
                            </li>
                        ))}
                        {tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length === 0 && (
                            <li className="text-xs text-gray-400">No high priority tasks.</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}
