import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { name, color, meta, google, shopify } = await req.json()
    const db = await getDb()
    const { rows } = await db.query(
      `UPDATE brands SET name=$1, color=$2, meta=$3, google=$4, shopify=$5
       WHERE id=$6 RETURNING *`,
      [name, color, meta ?? null, google ?? null, shopify ?? null, id]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDb()
    await db.query('DELETE FROM brands WHERE id=$1', [id])
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
