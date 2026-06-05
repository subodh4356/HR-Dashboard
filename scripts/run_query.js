
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '..', '.env.local');
const envConfig = dotenv.config({ path: envPath }).parsed;

if (!envConfig || !envConfig.DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in .env.local');
    process.exit(1);
}

const client = new Client({
    connectionString: envConfig.DATABASE_URL,
});

async function run() {
    const sqlFile = process.argv[2];
    if (!sqlFile) {
        console.error('Usage: node run_query.js <sql_file_name>');
        process.exit(1);
    }

    const sqlPath = path.resolve(__dirname, '..', sqlFile);
    if (!fs.existsSync(sqlPath)) {
        console.error(`Error: File ${sqlPath} not found`);
        process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        await client.connect();
        console.log(`Running query from: ${sqlFile}`);
        const res = await client.query(sql);
        console.log('Query Results:', JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error('Query failed:', err);
    } finally {
        await client.end();
    }
}

run();
