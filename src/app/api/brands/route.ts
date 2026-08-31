import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = await getDb()
    const { rows } = await db.query('SELECT * FROM brands ORDER BY created_at ASC')
    return NextResponse.json(rows)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, color, meta, google, shopify } = await req.json()
    const db = await getDb()
    const { rows } = await db.query(
      `INSERT INTO brands (name, color, meta, google, shopify)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, color, meta ?? null, google ?? null, shopify ?? null]
    )
    return NextResponse.json(rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
