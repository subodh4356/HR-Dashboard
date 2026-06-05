
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const envConfig = dotenv.config({ path: '.env.local' }).parsed;
const supabaseUrl = envConfig?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocs() {
    console.log("Attempting to query employee_documents...");

    // Simple fetch
    const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .limit(5);

    if (error) {
        console.error("Error querying employee_documents:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("Successfully queried employee_documents. Data:", data);
    }
}

checkDocs();
