import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ 
        role: 'assistant', 
        content: "I need a Google Generative AI API Key to answer your questions. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file." 
      })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const systemPrompt = `
      You are an expert D2C (Direct-to-Consumer) Marketing Strategist and Data Analyst.
      You are helping a brand manager analyze their Meta Ads and Shopify performance.
      
      CURRENT CONTEXT:
      ${JSON.stringify(context, null, 2)}

      GUIDELINES:
      - Be extremely data-driven.
      - If ROAS is below 2.0, suggest stopping underperforming ads.
      - If CTR is below 1.5%, suggest a hook/creative refresh.
      - If Shopify returns are high, suggest website description audits.
      - Keep responses concise but actionable (bullet points are good).
      - Reference specific metrics from the context provided.
    `

    const lastMessage = messages[messages.length - 1].content

    const result = await model.generateContent([
      { text: systemPrompt },
      ...messages.map((m: any) => ({ text: `${m.role.toUpperCase()}: ${m.content}` })),
      { text: `ASSISTANT:` }
    ])

    const response = await result.response
    const text = response.text()

    return NextResponse.json({ role: 'assistant', content: text })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
