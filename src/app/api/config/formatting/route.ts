import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId')
  if (!accountId) return NextResponse.json({ error: 'Missing accountId' }, { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('metric_formatting')
    .select('*')
    .eq('account_id', accountId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const { accountId, metricName, thresholds } = await req.json()
    if (!accountId || !metricName || !thresholds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('metric_formatting')
      .upsert({
        account_id: accountId,
        metric_name: metricName,
        thresholds,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id,metric_name',
      })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
