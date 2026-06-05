'use client';

import { createClient } from '@/lib/supabaseClient';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const STAGES = ['applied', 'phone-screen', 'interview', 'offer', 'hired', 'rejected'];

export default function KanbanBoard({
    requisitionId,
    candidates
}: {
    requisitionId: string,
    candidates: any[]
}) {
    const router = useRouter();
    const supabase = createClient();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleMove = async (candidateId: string, newStage: string) => {
        setLoadingId(candidateId);
        try {
            const { error } = await supabase
                .from('candidate')
                .update({ status: newStage })
                .eq('id', candidateId);

            if (error) throw error;

            // Audit log would be nice here

            router.refresh();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="flex h-full overflow-x-auto pb-4 gap-4">
            {STAGES.map((stage) => {
                const stageCandidates = candidates.filter(c => c.status === stage);
                return (
                    <div key={stage} className="w-80 flex-shrink-0 flex flex-col bg-gray-100 rounded-lg">
                        <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                            <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider">
                                {stage} <span className="text-gray-500 text-xs ml-1">({stageCandidates.length})</span>
                            </h3>
                        </div>
                        <div className="p-2 flex-1 overflow-y-auto space-y-2">
                            {stageCandidates.map(candidate => (
                                <div key={candidate.id} className="bg-white p-3 rounded shadow-sm border border-gray-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{candidate.first_name} {candidate.last_name}</p>
                                            <p className="text-xs text-gray-500">{candidate.email}</p>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <label className="text-xs text-gray-500 block mb-1">Move to:</label>
                                        <select
                                            className="block w-full text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                            value={candidate.status}
                                            onChange={(e) => handleMove(candidate.id, e.target.value)}
                                            disabled={loadingId === candidate.id}
                                        >
                                            {STAGES.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                            {stageCandidates.length === 0 && (
                                <div className="text-center py-4 text-xs text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded">
                                    Empty
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
