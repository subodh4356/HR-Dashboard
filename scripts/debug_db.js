const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config... not needed with node --env-file


const supabase = createClient(
    'https://sydtymhplkbbzsvygzri.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZHR5bWhwbGtiYnpzdnlnenJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTU1NDc5MiwiZXhwIjoyMDgxMTMwNzkyfQ.O0Ouy43cu-5GgW12q4Y5a0O8EiXp7GeMoJeuIeijTSw'
);

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
        console.log("Attendance table empty. Trying to insert a dummy to check schema if possible? No, just logging.");
    }
}

inspectAttendance();
