const { createClient } = require('@supabase/supabase-js');
// Hardcoded Env (Dev Only)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sydtymhplkbbzsvygzri.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZHR5bWhwbGtiYnpzdnlnenJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkxODE1NywiZXhwIjoyMDU5NDk0MTU3fQ.0tM2-wWJdYI6tGjRjBv8U1x7LqD8Lz9yG1G1X1X1X1X'; // Placeholder, assuming user env works or I'll rely on reading env if possible. Assuming script runs in environment with .env loaded if I use node --env-file.

// But wait, the user's environment might not be loaded in this script without dotenv.
// I'll try to just read the table with a known query or assume the user has the key.
// Actually, earlier script worked without me modifying the key, meaning it likely had the key or I'm forgetting.
// Checking previous debug_db.js content... it had createClient.

// Let's rely on the previous content logic but simplified.
// I will try to use the previously working script structure effectively.

async function main() {
    console.log("Checking Attendance Table...");
    // Since I don't have the keys here easily without dotenv, and previous script run worked, 
    // I will assume the keys were present in the previous script or environment.
    // Wait, the previous script had keys hardcoded? checking...
    // The previous view_file of debug_db.js showed:
    // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    // So the user environment must be set.

    // I'll write a script that tries to read the table structure
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching attendance:", error);
    } else {
        if (data && data.length > 0) {
            console.log("Attendance Columns:", Object.keys(data[0]));
        } else {
            console.log("Attendance table is empty.");
        }
    }
}

main();
