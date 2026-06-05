const fs = require('fs');
const path = require('path');

async function inspectPostgrestSchema() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });

  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });

  const schema = await res.json();
  
  if (schema.components && schema.components.schemas && schema.components.schemas.job_requisition) {
    const jrSchema = schema.components.schemas.job_requisition;
    console.log('--- job_requisition Table Definition ---');
    console.log('Properties:', Object.keys(jrSchema.properties));
  } else if (schema.definitions && schema.definitions.job_requisition) {
    const jrSchema = schema.definitions.job_requisition;
    console.log('--- job_requisition Table Definition ---');
    console.log('Properties:', Object.keys(jrSchema.properties));
  } else {
    console.log('job_requisition not found in schema. Available schemas:', Object.keys(schema.components ? schema.components.schemas : schema.definitions));
  }
}

inspectPostgrestSchema().catch(console.error);
