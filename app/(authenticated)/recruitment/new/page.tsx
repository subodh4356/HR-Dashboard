'use client';

import PageHeader from "@/components/PageHeader";
import JobPostForm from "@/components/JobPostForm";

export default function NewJobPage() {
    return (
        <div className="max-w-4xl mx-auto">
            <PageHeader title="Post New Job" description="Create a new job opening to start recruiting." />
            <JobPostForm />
        </div>
    );
}
