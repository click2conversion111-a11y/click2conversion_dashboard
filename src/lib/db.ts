import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

let initialized = false

export async function getDb() {
  if (!initialized) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#4D9EFF',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        meta JSONB,
        google JSONB,
        shopify JSONB
      )
    `)
    initialized = true
  }
  return pool
}
