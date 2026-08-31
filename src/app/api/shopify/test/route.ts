import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { shopUrl, accessToken } = await req.json()
    if (!shopUrl || !accessToken) {
      return NextResponse.json({ error: 'Missing shopUrl or accessToken' }, { status: 400 })
    }

    const shop = shopUrl.replace(/https?:\/\//, '').replace(/\/$/, '')

    const res = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Shopify rejected the credentials (${res.status}): ${text.slice(0, 200)}` },
        { status: 400 }
      )
    }

    const { shop: s } = await res.json()
    return NextResponse.json({ shop: { name: s.name, currency: s.currency, email: s.email, url: shop } })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
