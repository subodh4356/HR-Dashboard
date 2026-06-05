
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.config({ path: '.env.local' }).parsed;
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Checked via inspection
async function checkSchema() {
    console.log("Attempting to query attendance table to see error...");
    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error querying attendance:", error);
    } else {
        console.log("Successfully queried attendance. Data:", data);
    }
}

checkSchema();
