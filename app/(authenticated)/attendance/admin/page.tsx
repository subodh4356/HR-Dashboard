import { createClient } from "@/lib/supabaseSSR";
import DataTable from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import { format } from "date-fns";

export default async function AttendanceAdminPage() {
    const supabase = await createClient();

    // Fetch today's attendance for now, or paginated list
    const { data: attendance } = await supabase
        .from("attendance")
        .select(
            `
      id,
      date,
      check_in,
      check_out,
      status,
      employee:employee(first_name, last_name, email)
    `
        )
        .order("date", { ascending: false })
        .limit(50);

    // We are using a server component here, so we will pass data to a client component for the table usually,
    // but if we don't need interactivity (row click) we can just render strict HTML or use the DataTable with 'use client' wrapper inside or just invoke it if it was server compatible (it's not).
    // So we need a client wrapper.

    return <AttendanceAdminClient initialData={attendance || []} />;
}

import AttendanceAdminClient from "./client";
