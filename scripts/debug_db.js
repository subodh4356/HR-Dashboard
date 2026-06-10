const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAttendance() {
    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Attendance Error:", error);
    } else if (data && data.length > 0) {
        console.log("Attendance Columns:", Object.keys(data[0]));
    } else {
        console.log("Attendance table empty.");
    }
}

inspectAttendance();
