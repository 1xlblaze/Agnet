import { createClient, SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;
let admin: SupabaseClient | null = null;

export function getSql() {
  const url = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!url) {
    throw new Error("DATABASE_URL or SUPABASE_DB_URL is required");
  }
  if (!sql) {
    sql = postgres(url, { ssl: "require", max: 5, idle_timeout: 20 });
  }
  return sql;
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }
  if (!admin) {
    admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return admin;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL);
}

export function hasSupabaseAdmin() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
