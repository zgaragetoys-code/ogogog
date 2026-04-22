/**
 * Migration runner: connects to Supabase Postgres via the session pooler,
 * which accepts the service_role JWT as the password.
 *
 * Usage: npx tsx --env-file=.env.local scripts/migrate.ts <migration-file>
 *   e.g. npx tsx --env-file=.env.local scripts/migrate.ts supabase/migrations/005_profiles_rework.sql
 */

import { Client } from "pg";
import { readFileSync } from "fs";
import { resolve } from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract project ref from the Supabase URL
const projectRef = new URL(url).hostname.split(".")[0]; // e.g. xmfvklcwsjepurxwprhm

// Supabase session-mode pooler accepts the service role JWT as password
// Try the most common region hosts in order
const POOLER_REGIONS = [
  "aws-0-us-east-1",
  "aws-0-us-west-1",
  "aws-0-eu-west-1",
  "aws-0-eu-central-1",
  "aws-0-ap-southeast-1",
];

async function tryConnect(host: string): Promise<Client | null> {
  const client = new Client({
    host,
    port: 5432,
    database: "postgres",
    user: `postgres.${projectRef}`,
    password: serviceKey,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
    return client;
  } catch {
    await client.end().catch(() => {});
    return null;
  }
}

async function main() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error("Usage: migrate.ts <path-to-migration.sql>");
    process.exit(1);
  }

  const sql = readFileSync(resolve(process.cwd(), migrationFile), "utf8");

  console.log(`Connecting to Supabase project: ${projectRef}`);

  let client: Client | null = null;
  for (const region of POOLER_REGIONS) {
    const host = `${region}.pooler.supabase.com`;
    process.stdout.write(`  Trying ${host} ... `);
    client = await tryConnect(host);
    if (client) {
      console.log("connected.");
      break;
    }
    console.log("failed.");
  }

  if (!client) {
    console.error("\nCould not connect via session pooler. Set DATABASE_URL in .env.local and retry.");
    process.exit(1);
  }

  try {
    console.log(`\nRunning: ${migrationFile}`);
    await client.query(sql);
    console.log("Migration applied successfully.");
  } catch (err) {
    console.error("Migration failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
