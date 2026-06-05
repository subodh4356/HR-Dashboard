'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { MapPin, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function CheckInOut() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'checked_out' | 'checked_in'>('checked_out');
    const [lastLog, setLastLog] = useState<any>(null);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const supabase = createClient();
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // Get current user and today's status
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Check for profile to get employee id
            // Ideally we store employee_id in a context or something, but fetching is fine
            const { data: profile } = await supabase
                .from('user_profile')
                .select('employee_id')
                .eq('id', user.id)
                .single();

            if (!profile?.employee_id) return;

            const today = new Date().toISOString().split('T')[0];
            const { data: attendance } = await supabase
                .from('attendance')
                .select('*')
                .eq('employee_id', profile.employee_id)
                .eq('date', today)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (attendance) {
                setLastLog(attendance);
                if (attendance.check_in && !attendance.check_out) {
                    setStatus('checked_in');
                } else {
                    setStatus('checked_out');
                }
            }
        };
        init();

        // Get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            });
        }
    }, [supabase]);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const { data: profile } = await supabase
                .from('user_profile')
                .select('employee_id')
                .eq('id', userId!)
                .single();

            if (!profile?.employee_id) throw new Error("Employee record not found");

            const now = new Date();
            const today = now.toISOString().split('T')[0];
            // const time = now.toLocaleTimeString(); 

            if (status === 'checked_out') {
                // Check In
                const { error } = await supabase.from('attendance').insert({
                    employee_id: profile.employee_id,
                    date: today,
                    check_in: now.toISOString(),
                    status: 'present',
                    source: 'web',
                    location: location ? JSON.stringify(location) : null
                });
                if (error) throw error;
                setStatus('checked_in');
            } else {
                // Check Out - Find the LATEST OPEN session (ignore date, just in case it was yesterday)
                const { data: openSession, error: fetchError } = await supabase
                    .from('attendance')
                    .select('id')
                    .eq('employee_id', profile.employee_id)
                    .is('check_out', null)
                    .order('check_in', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (fetchError || !openSession) {
                    // Fallback: If no open session found but UI says checked in, maybe force check-in? 
                    // Or just alert user.
                    throw new Error("Could not find an active check-in session to close.");
                }

                const { error } = await supabase
                    .from('attendance')
                    .update({
                        check_out: now.toISOString()
                    })
                    .eq('id', openSession.id);

                if (error) throw error;
                setStatus('checked_out');
            }

            // Refresh logic
            window.location.reload();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow-md text-center">
            <h2 className="text-lg font-medium text-gray-900">Daily Attendance</h2>
            <div className="mt-4 flex flex-col items-center justify-center space-y-4">
                <div className="text-4xl font-bold text-gray-700">
                    {format(new Date(), 'HH:mm')}
                </div>
                <div className="text-sm text-gray-500">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 shadow-lg transition-transform hover:scale-105 active:scale-95 ${status === 'checked_in'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-green-500 bg-green-50 text-green-600'
                        }`}
                >
                    {loading ? (
                        <span className="text-sm font-medium">Processing...</span>
                    ) : (
                        <>
                            <Clock className="h-10 w-10 mb-2" />
                            <span className="text-lg font-bold">
                                {status === 'checked_in' ? 'Check Out' : 'Check In'}
                            </span>
                        </>
                    )}
                </button>

                {location && (
                    <div className="flex items-center text-xs text-gray-400">
                        <MapPin className="mr-1 h-3 w-3" />
                        Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </div>
                )}

                {lastLog && (
                    <div className="mt-4 w-full border-t pt-4 text-left text-sm text-gray-600">
                        <p className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            In: {lastLog.check_in ? format(new Date(lastLog.check_in), 'HH:mm') : '-'}
                        </p>
                        {lastLog.check_out && (
                            <p className="flex items-center mt-1">
                                <CheckCircle className="mr-2 h-4 w-4 text-red-500" />
                                Out: {format(new Date(lastLog.check_out), 'HH:mm')}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
