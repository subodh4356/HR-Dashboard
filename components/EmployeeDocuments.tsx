'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';

type Document = {
    id: string;
    name: string;
    file_path: string;
    created_at: string;
    file_type?: string;
};

export default function EmployeeDocuments({ employeeId, isAdmin = false }: { employeeId: string, isAdmin?: boolean }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedType, setSelectedType] = useState('General');
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchDocuments = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('employee_documents')
                .select('*')
                .eq('employee_id', employeeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error: any) {
            console.error('Error fetching documents JSON:', JSON.stringify(error, null, 2));
            console.error('Error Details Object:', error);
            // Don't toast on initial fetch, just log
        } finally {
            setLoading(false);
        }
    }, [employeeId, supabase]);

    useEffect(() => {
        if (employeeId) {
            fetchDocuments();
        }
    }, [employeeId, fetchDocuments]);

    const handleUploadComplete = async (path: string, fileName: string) => {
        // Create DB record
        try {
            const { error } = await supabase.from('employee_documents').insert({
                employee_id: employeeId,
                name: fileName,
                file_path: path,
                file_type: selectedType, // Use selected type
                uploaded_by: (await supabase.auth.getUser()).data.user?.id
            });

            if (error) throw error;

            toast.success('Document uploaded successfully');
            fetchDocuments(); // Refresh list
        } catch (error: any) {
            console.error('Error saving document record:', error);
            // Fallback alert because user reported not seeing toasts
            alert('Failed to save document record: ' + error.message);
            toast.error('Failed to save document record: ' + error.message);
        }
    };


    const handleDelete = async (path: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            // 1. Delete from DB
            const { error: dbError } = await supabase
                .from('employee_documents')
                .delete()
                .match({ file_path: path }); // Delete by path is safer here if ID not passed to uploader

            if (dbError) throw dbError;

            // 2. Delete from Storage (Optional, maybe keep for audit? But user likely wants it gone)
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([path]);

            if (storageError) console.warn('Storage delete warning:', storageError);

            toast.success('Document deleted');
            fetchDocuments();
        } catch (error: any) {
            toast.error('Error deleting document: ' + error.message);
        }
    };

    if (loading) return <div className="text-sm text-gray-500">Loading documents...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Managed Documents
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Upload official documents here. They will be stored securely.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Type
                    </label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    >
                        <option value="General">General</option>
                        <option value="Resume">Resume / CV</option>
                        <option value="ID Proof">ID Proof (Aadhaar/PAN)</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Contract">Contract</option>
                        <option value="Certificate">Certificate</option>
                        <option value="Payslip">Payslip</option>
                    </select>
                </div>

                <FileUploader
                    bucketName="documents"
                    folderPath={`employees/${employeeId}`}
                    onUploadComplete={handleUploadComplete}
                    existingFiles={documents.map(d => ({ name: d.name, path: d.file_path, type: d.file_type }))}
                    onDelete={isAdmin ? handleDelete : undefined}
                />
            </div>
        </div>
    );
}
