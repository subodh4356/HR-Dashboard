const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function testConnection() {
  console.log('--- Supabase Connection Test ---');

  // 1. Read .env.local
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found at:', envPath);
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      envVars[key] = value;
    }
  });

  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('URL found:', !!supabaseUrl, supabaseUrl ? `(${supabaseUrl.substring(0, 15)}...)` : '');
  console.log('Key found:', !!supabaseKey, supabaseKey ? '(Present)' : '');

  console.log(`URL Length: ${supabaseUrl ? supabaseUrl.length : 0}`);
  console.log(`Key Length: ${supabaseKey ? supabaseKey.length : 0}`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env.local');
    return;
  }

  // 3. Test Raw Reachability (Fetch)
  console.log('\nTesting raw fetch to Supabase...');
  try {
    const healthUrl = `${supabaseUrl}/rest/v1/`;
    console.log(`Fetching: ${healthUrl}`);
    const res = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    console.log('Fetch Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Fetch Body Preview:', text.substring(0, 100));
  } catch (fetchErr) {
    console.error('❌ Raw Fetch Failed:', fetchErr);
    if (fetchErr.cause) console.error('Cause:', fetchErr.cause);
    return; // Stop if raw fetch fails
  }

  // 4. Initialize Client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 5. Test Client connection (Anon)
  console.log('\nAttempting to fetch employees via Client (Anon Key)...');
  const { data: dataAnon, error: errorAnon } = await supabase.from('employee').select('count', { count: 'exact', head: true });

  if (errorAnon) {
    console.error('❌ Client (Anon) Failed:', errorAnon);
    console.error('Error JSON:', JSON.stringify(errorAnon, null, 2));
  } else {
    console.log('✅ Client (Anon) Successful!');
  }

  // 6. Test with Service Role Key (Bypass RLS)
  const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.log('\n⚠️ No SUPABASE_SERVICE_ROLE_KEY found in .env.local, skipping admin test.');
    return;
  }

  console.log('\nAttempting to fetch with Service Role Key...');
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { data: dataAdmin, error: errorAdmin } = await supabaseAdmin.from('employee').select('count', { count: 'exact', head: true });

  if (errorAdmin) {
    console.error('❌ Service Role Client Failed:', errorAdmin);
    console.error('Error JSON:', JSON.stringify(errorAdmin, null, 2));
  } else {
    console.log('✅ Service Role Client Successful! RLS Bypassed.');
    console.log('Count:', dataAdmin);
  }
}

testConnection().catch(console.error);
