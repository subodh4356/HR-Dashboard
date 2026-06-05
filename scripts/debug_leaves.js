
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envConfig = dotenv.config({ path: '.env.local' }).parsed;
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLeaves() {
    console.log("Attempting to query leave_request...");

    // Simulate the exact query from the page
    const { data, error } = await supabase
        .from('leave_request')
        .select('*, leave_policy!leave_request_leave_policy_id_fkey(name), employee(first_name, last_name)')
        .eq('status', 'pending')
        .limit(10);

    if (error) {
        console.error("Error querying leave_request:", error);
    } else {
        console.log("Successfully queried leave_request. Data:", data);
    }
}

checkLeaves();
