'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Policy {
    id: string;
    title: string;
    category: string;
    file_url: string;
    version: string;
    created_at: string;
}

export default function PolicyVault() {
    const supabase = createClient();
    const { role } = useUserRole();
    const isAdmin = role === 'admin';

    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    // Fetch Policies
    const fetchPolicies = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('policies').select('*').order('created_at', { ascending: false });
        if (!error && data) setPolicies(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    // Upload Handler
    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setUploading(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const category = formData.get('category') as string;
        const file = formData.get('file') as File;

        if (!file || !title) return;

        try {
            // 1. Upload File
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `policies/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
            if (uploadError) throw uploadError;

            // 2. Get Public URL (or signed URL if private, but assuming public/authenticated read for now)
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);

            // 3. Insert Record
            const { error: dbError } = await supabase.from('policies').insert({
                title,
                category,
                file_url: publicUrl,
                version: '1.0'
            });

            if (dbError) throw dbError;

            fetchPolicies();
            setIsUploadOpen(false);
        } catch (error: any) {
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Policy & Document Vault</h2>
                {isAdmin && (
                    <button
                        onClick={() => setIsUploadOpen(!isUploadOpen)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                        <Upload size={18} />
                        Upload Policy
                    </button>
                )}
            </div>

            {/* Upload Area */}
            {isUploadOpen && (
                <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                    <form onSubmit={handleUpload} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input name="title" required placeholder="Policy Title (e.g. Leave Policy)" className="border rounded px-3 py-2" />
                            <select name="category" className="border rounded px-3 py-2">
                                <option value="HR">HR Policy</option>
                                <option value="Legal">Legal / Compliance</option>
                                <option value="IT">IT & Security</option>
                                <option value="General">General</option>
                            </select>
                            <input type="file" name="file" required className="border rounded px-3 py-2 bg-white" />
                        </div>
                        <div className="flex justify-end">
                            <button disabled={uploading} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50">
                                {uploading ? 'Uploading...' : 'Publish Policy'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : policies.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No policies found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading your first HR policy.</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {policies.map((policy) => (
                            <li key={policy.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2">
                                        <FileText className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-sm font-medium text-indigo-600">{policy.title}</h4>
                                        <p className="text-xs text-gray-500">
                                            {policy.category} • Uploaded {format(new Date(policy.created_at), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        v{policy.version}
                                    </span>
                                    <a
                                        href={policy.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <Download size={20} />
                                    </a>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
