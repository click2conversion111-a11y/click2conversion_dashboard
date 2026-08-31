import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ShopifyOrder = {
  id: number
  created_at: string
  total_price: string
  financial_status: string
  fulfillment_status: string | null
  cancel_reason: string | null
  cancelled_at: string | null
  tags: string
  line_items: {
    product_id: number
    title: string
    quantity: number
    price: string
  }[]
}

function classifyOrder(order: ShopifyOrder): string {
  if (order.cancelled_at || order.financial_status === 'voided') return 'Cancelled'
  if (order.fulfillment_status === 'returned' ||
      order.fulfillment_status === 'attempted_delivery' ||
      order.tags?.includes('RTO')) return 'Returned'
  if (order.financial_status === 'paid' && order.fulfillment_status === 'fulfilled') return 'Delivered'
  if (order.financial_status === 'paid' &&
      (order.fulfillment_status === 'partial' || order.fulfillment_status === 'in_transit')) return 'Shipped'
  if (order.financial_status === 'pending') return 'Pending COD'
  if (order.financial_status === 'paid' && !order.fulfillment_status) return 'Processing'
  return 'Processing'
}

async function fetchAllOrders(shopUrl: string, accessToken: string, startDate: string, endDate: string) {
  const orders: ShopifyOrder[] = []
  const baseUrl =
    `https://${shopUrl}/admin/api/2024-01/orders.json?` +
    `status=any&created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z` +
    `&limit=250&fields=id,created_at,total_price,financial_status,fulfillment_status,cancel_reason,cancelled_at,tags,line_items`

  let nextUrl: string = baseUrl
  let hasNext = true

  while (hasNext) {
    const response: Response = await fetch(nextUrl, {
      headers: { 'X-Shopify-Access-Token': accessToken },
    })
    if (!response.ok) throw new Error(`Shopify API error: ${response.status}`)
    const json = await response.json()
    orders.push(...(json.orders as ShopifyOrder[]))

    const link = response.headers.get('Link')
    hasNext = false
    if (link) {
      const nextMatch = link.match(/<([^>]+)>;\s*rel="next"/)
      if (nextMatch) {
        nextUrl = nextMatch[1] as string
        hasNext = true
      }
    }
  }
  return orders
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const accountId = searchParams.get('accountId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!accountId || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  try {
    let shopUrl = searchParams.get('shopUrl')
    let accessToken = searchParams.get('accessToken')
    let currency = 'INR'

    if (!shopUrl || !accessToken) {
      const supabase = await createClient()
      const { data: conn } = await supabase
        .from('shopify_connections')
        .select('shop_url, access_token, currency')
        .eq('account_id', accountId)
        .eq('is_active', true)
        .maybeSingle()

      if (!conn) {
        return NextResponse.json({ error: 'Shopify not connected and no credentials provided' }, { status: 404 })
      }
      shopUrl = conn.shop_url
      accessToken = conn.access_token
      currency = conn.currency
    }

    const orders = await fetchAllOrders(shopUrl as string, accessToken as string, startDate, endDate)

    const counts: Record<string, number> = {}
    const revenue: Record<string, number> = {}
    const productMap: Record<string, { orders: number; revenue: number; delivered: number; cancelled: number; returned: number; prices: number[] }> = {}

    for (const order of orders) {
      const status = classifyOrder(order)
      counts[status] = (counts[status] || 0) + 1
      revenue[status] = (revenue[status] || 0) + parseFloat(order.total_price)

      for (const item of order.line_items || []) {
        const key = item.title
        if (!productMap[key]) {
          productMap[key] = { orders: 0, revenue: 0, delivered: 0, cancelled: 0, returned: 0, prices: [] }
        }
        const v = productMap[key]
        v.orders++
        const itemRevenue = parseFloat(item.price) * item.quantity
        v.revenue += itemRevenue
        v.prices.push(parseFloat(item.price))
        if (status === 'Delivered') v.delivered++
        if (status === 'Cancelled') v.cancelled++
        if (status === 'Returned') v.returned++
      }
    }

    const totalRevenue = Object.values(revenue).reduce((s, v) => s + v, 0)
    const confirmedRevenue = revenue['Delivered'] || 0
    const atRisk = revenue['Pending COD'] || 0
    const lost = (revenue['Cancelled'] || 0) + (revenue['Returned'] || 0)

    const products = Object.entries(productMap).map(([name, v]) => ({
      name,
      orders: v.orders,
      revenue: v.revenue,
      delivered: v.delivered,
      cancelled: v.cancelled,
      returned: v.returned,
      return_rate: v.orders > 0 ? ((v.returned + v.cancelled) / v.orders) * 100 : 0,
      aov: v.orders > 0 ? v.revenue / v.orders : 0,
    })).sort((a, b) => b.revenue - a.revenue)

    return NextResponse.json({
      counts: {
        total: orders.length,
        ...counts,
      },
      revenue: {
        gross: totalRevenue,
        confirmed: confirmedRevenue,
        at_risk: atRisk,
        lost,
      },
      products,
      orders: orders.map(o => ({
        id: o.id,
        created_at: o.created_at,
        total_price: o.total_price,
        status: classifyOrder(o),
        line_items: o.line_items.length
      })).slice(0, 100), // Limit to last 100 for performance
      currency: currency,
      fetchedAt: new Date().toISOString(),
    })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
