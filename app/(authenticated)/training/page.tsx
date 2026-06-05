'use client';

import React, { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { createClient } from '@/lib/supabaseClient';
import { useUserRole } from '@/hooks/useUserRole';
import { logAudit } from '@/lib/audit';
import { toast } from 'sonner';
import { 
    BookOpen, 
    GraduationCap, 
    Plus, 
    Search, 
    Clock, 
    User, 
    Briefcase,
    Award,
    CheckCircle2,
    Loader2,
    ChevronRight,
    Play,
    Printer,
    FileText,
    Calendar
} from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    department: string;
    duration: string;
    instructor: string;
    is_active: boolean;
    created_at: string;
    enrollment_count?: number;
}

interface Enrollment {
    id: string;
    course_id: string;
    employee_id: string;
    status: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed';
    progress: number;
    completed_at: string | null;
    grade: string | null;
    created_at: string;
    course?: Course;
}

export default function TrainingPage() {
    const supabase = createClient();
    const { role, employeeId, user } = useUserRole();

    const [activeTab, setActiveTab] = useState<'catalog' | 'learning'>('catalog');
    
    // Core data states
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    // Search and filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDept, setSelectedDept] = useState('All');

    // Admin Course Management
    const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDesc, setCourseDesc] = useState('');
    const [courseDept, setCourseDept] = useState('General');
    const [courseDuration, setCourseDuration] = useState('');
    const [courseInstructor, setCourseInstructor] = useState('');

    // Course Simulation / Launch states
    const [activeEnrollment, setActiveEnrollment] = useState<Enrollment | null>(null);
    const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
    const [simulationProgress, setSimulationProgress] = useState(0);

    // Certificate viewer
    const [certificateEnrollment, setCertificateEnrollment] = useState<Enrollment | null>(null);

    const isHrOrAdmin = role === 'admin' || role === 'hr';

    useEffect(() => {
        if (user || employeeId) {
            fetchData();
        }
    }, [user, employeeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch courses
            const { data: coursesData } = await supabase
                .from('training_course')
                .select('*')
                .order('created_at', { ascending: false });
            setCourses(coursesData || []);

            // 2. Fetch enrollments
            if (employeeId) {
                const { data: enrollmentsData } = await supabase
                    .from('training_enrollment')
                    .select('*, course:training_course(*)')
                    .eq('employee_id', employeeId);
                setEnrollments(enrollmentsData || []);
            }
        } catch (error) {
            console.error("Failed to fetch training data", error);
            toast.error("Failed to load LMS details.");
        } finally {
            setLoading(false);
        }
    };

    // Course creation
    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseTitle || !courseDuration || !courseInstructor) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('training_course')
                .insert({
                    title: courseTitle,
                    description: courseDesc,
                    department: courseDept,
                    duration: courseDuration,
                    instructor: courseInstructor,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            toast.success("Course added to directory!");
            await logAudit('CREATE_COURSE', 'training_course', data.id, { title: courseTitle });
            setIsAddCourseModalOpen(false);
            setCourseTitle('');
            setCourseDesc('');
            setCourseDept('General');
            setCourseDuration('');
            setCourseInstructor('');
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to create course.");
        }
    };

    // Enroll in a course
    const handleEnroll = async (courseId: string, courseTitle: string) => {
        if (!employeeId) {
            toast.error("No linked employee account found. Can't enroll.");
            return;
        }

        try {
            const { data, error } = await supabase
                .from('training_enrollment')
                .insert({
                    course_id: courseId,
                    employee_id: employeeId,
                    status: 'Enrolled',
                    progress: 0
                })
                .select()
                .single();

            if (error) throw error;

            toast.success(`Enrolled in "${courseTitle}"!`);
            await logAudit('ENROLL_COURSE', 'training_enrollment', data.id, { course_title: courseTitle });
            fetchData();
            setActiveTab('learning');
        } catch (err: any) {
            toast.error("You are already enrolled or registration failed.");
        }
    };

    // Simulate training progress
    const handleLaunchCourse = (enrollment: Enrollment) => {
        setActiveEnrollment(enrollment);
        setSimulationProgress(enrollment.progress);
        setIsSimulationModalOpen(true);
    };

    const handleUpdateProgress = async (newProgress: number) => {
        if (!activeEnrollment) return;

        let status: Enrollment['status'] = 'In Progress';
        let completedAt: string | null = null;

        if (newProgress >= 100) {
            newProgress = 100;
            status = 'Completed';
            completedAt = new Date().toISOString().split('T')[0];
        }

        try {
            const { error } = await supabase
                .from('training_enrollment')
                .update({
                    progress: newProgress,
                    status,
                    completed_at: completedAt
                })
                .eq('id', activeEnrollment.id);

            if (error) throw error;

            toast.success(`Progress updated to ${newProgress}%`);
            
            if (newProgress === 100) {
                toast.success("Congratulations! You completed the course.", {
                    duration: 5000,
                });
                await logAudit('COMPLETE_COURSE', 'training_enrollment', activeEnrollment.id, {
                    course_title: activeEnrollment.course?.title
                });
            }

            setSimulationProgress(newProgress);
            
            // Update local state
            setActiveEnrollment(prev => prev ? { ...prev, progress: newProgress, status, completed_at: completedAt } : null);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to save progress.");
        }
    };

    // Filter courses
    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept = selectedDept === 'All' || course.department === selectedDept;

        return matchesSearch && matchesDept;
    });

    const uniqueDepartments = Array.from(new Set(courses.map(c => c.department)));

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader 
                title="Training & LMS" 
                description="Expand your skills, complete compliance training, and earn certificates." 
            />

            {/* Premium Tab Buttons */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('catalog')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === 'catalog'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <BookOpen className="w-4.5 h-4.5" />
                    Course Directory
                </button>
                <button
                    onClick={() => setActiveTab('learning')}
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                        activeTab === 'learning'
                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                >
                    <GraduationCap className="w-4.5 h-4.5" />
                    My Learning Track
                </button>
            </div>

            {/* TAB: COURSE DIRECTORY */}
            {activeTab === 'catalog' && (
                <div className="space-y-6">
                    {/* Search & Filter Bar */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-1 gap-3 w-full">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses, instructors, lessons..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-xl text-sm focus:outline-indigo-550"
                                />
                            </div>
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="border border-slate-250 rounded-xl px-4 py-2 text-sm text-slate-700 bg-white"
                            >
                                <option value="All">All Departments</option>
                                <option value="General">General</option>
                                {uniqueDepartments.filter(d => d !== 'General' && d).map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        {isHrOrAdmin && (
                            <button
                                onClick={() => setIsAddCourseModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-xl shadow-xs w-full md:w-auto justify-center"
                            >
                                <Plus className="w-4 h-4" />
                                Add Course
                            </button>
                        )}
                    </div>

                    {/* Courses Grid */}
                    {filteredCourses.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                            <h4 className="text-slate-755 font-semibold mt-4 text-sm">No Courses Available</h4>
                            <p className="text-slate-400 text-xs mt-1">Check back later or try clearing your filters.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map(course => {
                                const userEnrollment = enrollments.find(e => e.course_id === course.id);

                                return (
                                    <div key={course.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition duration-200 flex flex-col justify-between">
                                        <div className="p-5 space-y-4">
                                            {/* Header with Department Badge */}
                                            <div className="flex justify-between items-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                    <Briefcase className="w-3 h-3" />
                                                    {course.department}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    {course.duration}
                                                </span>
                                            </div>

                                            <div className="space-y-1.5">
                                                <h4 className="font-bold text-slate-900 text-sm">{course.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{course.description || 'No description provided.'}</p>
                                            </div>
                                        </div>

                                        {/* Footer with Instructor & Action */}
                                        <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-slate-200 p-1.5 rounded-full text-slate-600">
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="text-[11px]">
                                                    <div className="text-slate-400 font-medium">Instructor</div>
                                                    <div className="text-slate-700 font-semibold">{course.instructor}</div>
                                                </div>
                                            </div>

                                            {userEnrollment ? (
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                                                    userEnrollment.status === 'Completed'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-indigo-100 text-indigo-800'
                                                }`}>
                                                    {userEnrollment.status === 'Completed' ? 'Completed' : 'Enrolled'}
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleEnroll(course.id, course.title)}
                                                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-lg shadow-sm"
                                                >
                                                    Enroll Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB: MY LEARNING TRACK */}
            {activeTab === 'learning' && (
                <div className="space-y-6">
                    {enrollments.length === 0 ? (
                        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
                            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
                            <h4 className="text-slate-755 font-semibold mt-4 text-sm">No Enrolled Courses</h4>
                            <p className="text-slate-400 text-xs mt-1">Browse our course directory to kickstart your learning journey.</p>
                            <button
                                onClick={() => setActiveTab('catalog')}
                                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-lg shadow-xs"
                            >
                                View Directory
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {enrollments.map(enroll => (
                                <div key={enroll.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition duration-200 flex flex-col justify-between space-y-5">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                enroll.status === 'Completed'
                                                    ? 'bg-emerald-100 text-emerald-850'
                                                    : 'bg-indigo-100 text-indigo-850'
                                            }`}>
                                                {enroll.status}
                                            </span>
                                            {enroll.status === 'Completed' && (
                                                <button
                                                    onClick={() => setCertificateEnrollment(enroll)}
                                                    className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold underline decoration-dotted decoration-amber-600"
                                                >
                                                    <Award className="w-3.5 h-3.5 fill-current" />
                                                    View Certificate
                                                </button>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-sm">{enroll.course?.title || 'Course Details'}</h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">{enroll.course?.description || 'Learn and develop skills.'}</p>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                        {/* Progress indicator */}
                                        <div className="flex justify-between items-center text-xs font-semibold">
                                            <span className="text-slate-400">Course Progress</span>
                                            <span className="text-indigo-650">{enroll.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-indigo-650 h-full rounded-full transition-all duration-300"
                                                style={{ width: `${enroll.progress}%` }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-1">
                                            {enroll.status !== 'Completed' ? (
                                                <button
                                                    onClick={() => handleLaunchCourse(enroll)}
                                                    className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                                                >
                                                    <Play className="w-3 h-3 fill-current" />
                                                    Resume Course
                                                </button>
                                            ) : (
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    Completed on {enroll.completed_at || 'N/A'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: CREATE COURSE */}
            {isAddCourseModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
                        <div className="p-5 border-b border-slate-150 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Add Training Course</h3>
                            <button
                                onClick={() => setIsAddCourseModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={handleCreateCourse} className="p-5 space-y-4">
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Course Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={courseTitle}
                                    onChange={(e) => setCourseTitle(e.target.value)}
                                    placeholder="e.g. Prevention of Sexual Harassment (POSH)"
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Course Description</label>
                                <textarea
                                    rows={3}
                                    value={courseDesc}
                                    onChange={(e) => setCourseDesc(e.target.value)}
                                    placeholder="Outline syllabus and core concepts..."
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Duration *</label>
                                    <input
                                        type="text"
                                        required
                                        value={courseDuration}
                                        onChange={(e) => setCourseDuration(e.target.value)}
                                        placeholder="e.g. 2 hours / 3 days"
                                        className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-xs font-semibold text-slate-700">Department Track</label>
                                    <select
                                        value={courseDept}
                                        onChange={(e) => setCourseDept(e.target.value)}
                                        className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550 bg-white"
                                    >
                                        <option value="General">General Track</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Human Resources">Human Resources</option>
                                        <option value="Finance">Finance</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-700">Lead Instructor *</label>
                                <input
                                    type="text"
                                    required
                                    value={courseInstructor}
                                    onChange={(e) => setCourseInstructor(e.target.value)}
                                    placeholder="Instructor name or entity"
                                    className="w-full text-sm border border-slate-250 rounded-lg p-2.5 focus:outline-indigo-550"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddCourseModalOpen(false)}
                                    className="px-4 py-2 border border-slate-250 rounded-lg text-sm font-semibold hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
                                >
                                    Add Course
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: SIMULATE COURSE PLAYBACK */}
            {isSimulationModalOpen && activeEnrollment && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
                        <div className="bg-indigo-950 p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-base text-indigo-200">Interactive Course Player</h3>
                                <h4 className="font-black text-lg mt-0.5">{activeEnrollment.course?.title}</h4>
                            </div>
                            <button
                                onClick={() => setIsSimulationModalOpen(false)}
                                className="text-indigo-300 hover:text-white font-bold text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Simulator Sandbox */}
                            <div className="bg-slate-900 aspect-video rounded-xl flex flex-col justify-between p-4 relative overflow-hidden shadow-inner text-white border border-slate-800">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950/80 to-slate-950/95 pointer-events-none" />
                                <div className="z-10 flex justify-between text-[11px] text-indigo-400 font-bold uppercase tracking-wider">
                                    <span>Lesson Video 4 / 6</span>
                                    <span>Instructor: {activeEnrollment.course?.instructor}</span>
                                </div>
                                <div className="z-10 text-center space-y-2">
                                    <BookOpen className="w-12 h-12 text-indigo-500 mx-auto animate-pulse" />
                                    <p className="text-sm font-semibold text-slate-200">Simulating e-Learning video content playback...</p>
                                    <p className="text-[10px] text-slate-400">Please interact with the progress controls below to complete this module.</p>
                                </div>
                                <div className="z-10 space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-400">
                                        <span>Time Remaining: {activeEnrollment.course?.duration}</span>
                                        <span>Status: {activeEnrollment.status}</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                        <div className="bg-indigo-550 h-full rounded-full transition-all" style={{ width: `${simulationProgress}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Simulation buttons */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                                    <span>Set Course Progression</span>
                                    <span className="text-indigo-600 font-bold">{simulationProgress}%</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleUpdateProgress(Math.min(100, simulationProgress + 25))}
                                        className="flex-1 py-2 px-3 border border-slate-250 hover:bg-slate-50 transition rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current text-indigo-650" />
                                        Next Chapter (+25%)
                                    </button>
                                    <button
                                        onClick={() => handleUpdateProgress(100)}
                                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white transition rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Instant Complete
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setIsSimulationModalOpen(false)}
                                className="px-4 py-2 border border-slate-250 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Close Player
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: CORPORATE ACHIEVEMENT CERTIFICATE */}
            {certificateEnrollment && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">LMS Academic Transcript Vault</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-250 hover:bg-slate-100 transition rounded-lg"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    Print Certificate
                                </button>
                                <button
                                    onClick={() => setCertificateEnrollment(null)}
                                    className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2"
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Certificate Body (Wow-factor design) */}
                        <div className="p-8 md:p-12 bg-slate-50 flex justify-center items-center">
                            <div className="bg-white w-full max-w-2xl border-[12px] border-slate-900 p-8 md:p-12 rounded-lg shadow-sm relative overflow-hidden flex flex-col items-center text-center space-y-6">
                                {/* Elegant Double gold/slate thin border inside */}
                                <div className="absolute inset-2 border border-amber-600/40 pointer-events-none" />

                                {/* Subtle background graphic */}
                                <div className="absolute top-0 right-0 -translate-y-6 translate-x-6 opacity-[0.02]">
                                    <GraduationCap className="w-96 h-96 text-slate-950" />
                                </div>

                                <div className="space-y-2">
                                    <Award className="w-12 h-12 text-amber-500 mx-auto stroke-1" />
                                    <h2 className="font-serif tracking-widest text-slate-900 text-lg md:text-xl uppercase font-black">
                                        Certificate of Completion
                                    </h2>
                                    <div className="h-0.5 w-32 bg-amber-550 mx-auto" />
                                </div>

                                <div className="space-y-4">
                                    <p className="font-serif italic text-slate-500 text-xs md:text-sm">
                                        This is proudly presented to
                                    </p>
                                    <p className="text-slate-900 font-extrabold text-lg md:text-2xl border-b border-slate-200 pb-1 w-64 mx-auto font-sans">
                                        {user?.email ? user.email.split('@')[0].toUpperCase() : 'EMPLOYEE'}
                                    </p>
                                    <p className="text-slate-500 text-[11px] md:text-xs leading-relaxed max-w-md mx-auto">
                                        for the successful completion and mastery of the required course materials, evaluations, and compliance parameters for
                                    </p>
                                    <p className="text-indigo-950 font-black text-sm md:text-lg">
                                        &ldquo;{certificateEnrollment.course?.title}&rdquo;
                                    </p>
                                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                                        Duration: {certificateEnrollment.course?.duration} | Department: {certificateEnrollment.course?.department}
                                    </p>
                                </div>

                                {/* Signatures and details */}
                                <div className="grid grid-cols-2 gap-12 w-full pt-6 border-t border-slate-100 max-w-md text-center text-[10px] md:text-xs">
                                    <div className="space-y-1">
                                        <div className="font-serif italic text-slate-800 border-b border-slate-200 pb-0.5 font-semibold text-xs md:text-sm">
                                            {certificateEnrollment.course?.instructor}
                                        </div>
                                        <div className="text-slate-400 font-medium">Lead Instructor</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="font-serif italic text-slate-800 border-b border-slate-200 pb-0.5 font-semibold text-xs md:text-sm">
                                            HR Portal Academy
                                        </div>
                                        <div className="text-slate-400 font-medium">Authorized Registrar</div>
                                    </div>
                                </div>

                                <div className="text-[9px] text-slate-400 pt-2 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Certificate Code: {certificateEnrollment.id.substring(0, 8).toUpperCase()} | Completed: {certificateEnrollment.completed_at}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
