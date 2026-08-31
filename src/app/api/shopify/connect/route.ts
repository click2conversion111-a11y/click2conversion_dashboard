import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { accountId, shopUrl, accessToken } = await req.json()
    if (!accountId || !shopUrl || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Normalize shop URL
    const shop = shopUrl.replace(/https?:\/\//, '').replace(/\/$/, '')

    // Test connection
    const testRes = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    })

    if (!testRes.ok) {
      return NextResponse.json({ error: 'Invalid Shopify credentials' }, { status: 400 })
    }

    const shopData = await testRes.json()
    const shopInfo = shopData.shop

    const supabase = await createClient()
    const { error } = await supabase
      .from('shopify_connections')
      .upsert({
        account_id: accountId,
        shop_url: shop,
        shop_name: shopInfo.name,
        access_token: accessToken,
        currency: shopInfo.currency,
        is_active: true,
        connected_at: new Date().toISOString(),
      }, {
        onConflict: 'account_id',
      })

    if (error) throw error

    return NextResponse.json({
      success: true,
      shop: {
        name: shopInfo.name,
        url: shop,
        currency: shopInfo.currency,
        email: shopInfo.email,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
