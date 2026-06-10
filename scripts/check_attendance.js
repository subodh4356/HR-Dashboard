const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
    console.log("Checking Attendance Table...");
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local");
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
