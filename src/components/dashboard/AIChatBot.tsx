'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, User, Sparkles, Loader2, Minus, Maximize2, AlertTriangle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface AIChatBotProps {
  context?: any
}

export default function AIChatBot({ context }: AIChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! I'm your D2C Intelligence Bot. I've analyzed your current dashboard data. How can I help you scale today?", timestamp: new Date().toLocaleTimeString() }
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { 
      role: 'user', 
      content: input.trim(), 
      timestamp: new Date().toLocaleTimeString() 
    }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context 
        }),
      })

      const data = await res.json()
      
      if (data.error) throw new Error(data.error)

      const assistantMsg: Message = { 
        role: 'assistant', 
        content: data.content, 
        timestamp: new Date().toLocaleTimeString() 
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (e: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to my brain right now. Please make sure your GOOGLE_GENERATIVE_AI_API_KEY is set correctly.", 
        timestamp: new Date().toLocaleTimeString() 
      }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] group"
      >
        <MessageSquare size={24} />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex flex-col bg-[#0D0F14] border border-white/10 rounded-3xl shadow-2xl transition-all duration-300 overflow-hidden ${isMinimized ? 'h-14 w-64' : 'h-[600px] w-[420px]'}`}>
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-indigo-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-black text-white uppercase tracking-tight">D2C Intelligence Bot</span>
            {!isMinimized && <p className="text-[9px] text-white/70 font-bold uppercase tracking-widest">Powered by Gemini 1.5</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minus size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-[#0D0F14]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] space-y-1`}>
                  <div className={`p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-[#1A1D26] text-gray-200 rounded-tl-none border border-white/5'
                  }`}>
                    {m.content.split('\n').map((line, j) => (
                      <p key={j} className={line.startsWith('-') || line.startsWith('*') ? 'ml-2 -indent-2 mb-1' : 'mb-2'}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600 px-2 font-medium">{m.timestamp}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1A1D26] p-4 rounded-2xl rounded-tl-none border border-white/5 flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Analyzing Brand Metrics...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-5 border-t border-white/5 bg-[#141824]/50">
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-[#1A1D26] border border-white/10 focus-within:border-indigo-500/50 transition-all shadow-inner">
              <input
                type="text"
                placeholder="Ask about ROAS, Creative, or Shopify sales..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-transparent text-sm outline-none px-3 py-1 text-white placeholder:text-gray-600"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-indigo-500 transition-all shadow-lg active:scale-95"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
               <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brand Intel Active</span>
               </div>
               <p className="text-[9px] text-gray-600 font-medium">Shift + Enter for multiline</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
