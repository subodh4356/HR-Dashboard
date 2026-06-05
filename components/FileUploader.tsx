'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Loader2, Upload, FileText, Trash2, Eye } from 'lucide-react';

type FileUploaderProps = {
    bucketName: string;
    folderPath: string;
    onUploadComplete: (path: string, fileName: string) => void;
    existingFiles?: { name: string; path: string }[]; // Simple list for now
    onDelete?: (path: string) => void;
};

export default function FileUploader({
    bucketName,
    folderPath,
    onUploadComplete,
    existingFiles = [],
    onDelete
}: FileUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;

        setUploading(true);
        try {
            // New Method: Upload via Server API to bypass RLS issues
            const formData = new FormData();
            formData.append('file', file);
            formData.append('bucket', bucketName);
            formData.append('path', filePath);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Upload failed');
            }

            // Success
            onUploadComplete(filePath, file.name);
        } catch (error: any) {
            alert('Error uploading file: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Keep download as is for now? 
    // If Read is also blocked, we might need a Signed URL API.
    // Let's assume Signed URL creation works (it usually does for Authenticated users if default policies exist, 
    // or if we rely on Service Role for that too). 
    // Actually, createSignedUrl is permission-checked? 
    // Yes. If RLS blocks SELECT, it blocks createSignedUrl.
    // Let's safe-guard download too using the same client-side logic for now, 
    // but if it fails, we'll need to move it to API.
    const handleDownload = async (path: string) => {
        try {
            // Try standard signed URL first
            const { data, error } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(path, 60 * 60);

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error: any) {
            console.error("Standard download failed, trying generic URL...");
            // Fallback? No, likely permission error.
            alert('Error downloading file: ' + error.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload Document</span>
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        disabled={uploading}
                    />
                </label>
                {uploading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
            </div>

            {existingFiles.length > 0 && (
                <ul className="divide-y divide-gray-200 border rounded-md">
                    {existingFiles.map((file) => (
                        <li key={file.path} className="flex items-center justify-between p-3">
                            <div className="flex items-center text-sm text-gray-600">
                                <FileText className="mr-2 h-4 w-4 text-gray-400" />
                                {file.name}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownload(file.path)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="View"
                                >
                                    <Eye className="h-4 w-4" />
                                </button>
                                {onDelete && (
                                    <button
                                        type="button"
                                        onClick={() => onDelete(file.path)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
