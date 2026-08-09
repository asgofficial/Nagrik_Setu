const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.kyckbxcgncpfgxtkccoa:F71kTrkd7j6AxqaY@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";

if (!connectionString) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  process.exit(1);
}

const sqlPath = path.join(__dirname, 'supabase_schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log("Connecting to Supabase PostgreSQL database...");
const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log("Connected successfully! Running database schema migrations...");
    
    await client.query(sql);
    
    console.log("\n=======================================================");
    console.log("✓ Success! Jansetu database schema initialized successfully!");
    console.log("✓ Created tables: public.profiles, public.grievances, public.clusters, public.confirmations, public.notifications, public.audit_log");
    console.log("✓ Created RLS policies and user registration triggers.");
    console.log("=======================================================");
  } catch (err) {
    console.error("Database initialization failed:", err);
  } finally {
    await client.end();
  }
}

main();
