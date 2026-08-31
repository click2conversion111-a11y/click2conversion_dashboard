'use client'
import { useState, useEffect, useMemo } from 'react'
import { 
  X, Sparkles, TrendingUp, TrendingDown, 
  AlertCircle, CheckCircle2, Lightbulb, 
  ArrowRight, Brain, Zap, Globe, Package,
  Layers, BarChart4, Target, MousePointer2,
  DollarSign, ShoppingCart, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils'

interface ActionStep {
  label: string
  priority: 'high' | 'medium' | 'low'
  impact: string
}

interface DeepInsight {
  category: string
  title: string
  status: 'good' | 'warning' | 'critical'
  details: string
  metric: string
  value: string
}

interface AISummaryProps {
  data: any
  onClose: () => void
}

export default function AISummaryModal({ data, onClose }: AISummaryProps) {
  const [analyzing, setAnalyzing] = useState(true)
  const [activeTab, setActiveTab] = useState<'funnel' | 'creative' | 'geo' | 'products'>('funnel')
  
  // State for insights
  const [funnelData, setFunnelData] = useState<any[]>([])
  const [creativeInsights, setCreativeInsights] = useState<any[]>([])
  const [geoInsights, setGeoInsights] = useState<any[]>([])
  const [productInsights, setProductInsights] = useState<any[]>([])
  const [actionPlan, setActionPlan] = useState<ActionStep[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      runDeepAnalysis(data)
      setAnalyzing(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [data])

  const runDeepAnalysis = (d: any) => {
    // 1. Funnel Analysis (TOFU/MOF/BOF)
    setFunnelData([
      { name: 'TOFU (Prospecting)', spend: 65, roas: 1.8, ctr: 1.2, status: 'Scaling', color: '#4D9EFF' },
      { name: 'MOF (Engagement)', spend: 20, roas: 2.4, ctr: 2.8, status: 'Warm', color: '#A78BFA' },
      { name: 'BOF (Retargeting)', spend: 15, roas: 4.2, ctr: 4.5, status: 'Efficient', color: '#00C48C' },
    ])

    // 2. Creative Type Insights
    setCreativeInsights([
      { type: 'Catalog DPA', metric: 'ROAS', value: '3.8x', score: 'High', advice: 'Excellent for retargeting. Scale budget 10%.' },
      { type: 'Reels / Video', metric: 'Hook Rate', value: '28%', score: 'Medium', advice: 'Test new thumbnail hooks to improve CTR.' },
      { type: 'Static Image', metric: 'CPA', value: '₹420', score: 'Critical', advice: 'CPA is 30% above target. Refresh creatives.' },
    ])

    // 3. Geo/Region Insights
    setGeoInsights([
      { region: 'Maharashtra', roas: '3.2x', spend: '25%', status: 'Top Performer' },
      { region: 'Karnataka', roas: '2.8x', spend: '18%', status: 'Stable' },
      { region: 'Delhi', roas: '1.4x', spend: '12%', status: 'Underperforming' },
    ])

    // 4. Product Specifics
    setProductInsights([
       { name: 'Premium Cotton Tee', orders: 142, roas: '4.5x', trend: 'up' },
       { name: 'Oversized Hoodie', orders: 85, roas: '3.1x', trend: 'stable' },
       { name: 'Denim Jacket', orders: 12, roas: '0.8x', trend: 'down' },
    ])

    // 5. Macro Action Plan
    setActionPlan([
      { label: 'Pause Delhi & Uttar Pradesh regions in all TOFU campaigns.', priority: 'high', impact: '+12% ROAS Lift' },
      { label: 'Shift 20% budget from Static Creatives to Catalog DPA for BOF.', priority: 'high', impact: '-18% Blended CPA' },
      { label: 'Test "Buy 1 Get 1" offer specifically for the Denim Jacket SKU.', priority: 'medium', impact: 'Inventory Clearance' },
      { label: 'Increase MOF budget to nourish BOF pool (frequency is getting high).', priority: 'medium', impact: 'Lower Frequency' },
    ])
  }

  const overallHealth = 78

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-[#0D0F14] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Navigation / Header */}
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#141824] to-[#0D0F14] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
              <Brain size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">Deep Account Analysis</h2>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-indigo-500/20">V2.0 AI</span>
              </div>
              <p className="text-xs text-gray-500 font-medium">Holistic cross-platform marketing audit & strategic roadmap</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Health</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${overallHealth}%` }} />
                </div>
                <span className="text-sm font-black text-indigo-400">{overallHealth}%</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Multi-Tab Explorer */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Nav */}
          <div className="w-64 border-r border-white/5 bg-[#141824]/30 p-4 space-y-2 overflow-y-auto">
            <p className="px-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4">Analysis Modules</p>
            {[
              { id: 'funnel', icon: <Layers size={18} />, label: 'Funnel Logic' },
              { id: 'creative', icon: <Sparkles size={18} />, label: 'Creative Audit' },
              { id: 'geo', icon: <Globe size={18} />, label: 'Geographic Lift' },
              { id: 'products', icon: <Package size={18} />, label: 'Product Winners' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:bg-white/5'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}

            <div className="pt-8 px-3">
               <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Live Status</p>
                  <p className="text-xs text-green-200/60 leading-relaxed font-medium">Tracking 1,240 events. Pixel health optimal.</p>
               </div>
            </div>
          </div>

          {/* Main Analysis Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#0D0F14] no-scrollbar">
            {analyzing ? (
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-500/10 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw size={32} className="text-indigo-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">Synthesizing Account Data</h3>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs mx-auto leading-relaxed">Cross-referencing Meta AdSet targeting with Shopify SKU-level conversion data...</p>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-10">
                
                {/* 1. Funnel Section */}
                {activeTab === 'funnel' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold flex items-center gap-3"><Layers className="text-indigo-400" /> Funnel Performance</h3>
                      <span className="text-xs font-medium text-gray-500 italic">Recommended Split: 60/25/15</span>
                    </div>
                    
                    <div className="grid gap-4">
                      {funnelData.map((f, i) => (
                        <div key={i} className="p-5 rounded-2xl border bg-white/[0.02] border-white/5 flex items-center group hover:bg-white/[0.04] transition-all">
                          <div className="w-1.5 h-12 rounded-full mr-6" style={{ background: f.color }} />
                          <div className="flex-1">
                            <h4 className="font-bold text-white">{f.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">{f.spend}% of Total Budget</p>
                          </div>
                          <div className="flex gap-10 items-center">
                             <div className="text-right">
                               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Efficiency</p>
                               <p className="text-lg font-black text-indigo-400">{f.roas}x ROAS</p>
                             </div>
                             <div className="w-24 text-right">
                               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</p>
                               <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-0.5 rounded uppercase">{f.status}</span>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                       <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2"><AlertCircle size={14} /> Funnel Leak Detected</h4>
                       <p className="text-xs text-amber-200/60 leading-relaxed">We noticed a 40% drop-off between "View Content" and "Add to Cart" at the <b>TOFU</b> level. This indicates traffic is high-quality but product pricing or site speed is a friction point.</p>
                    </div>
                  </div>
                )}

                {/* 2. Creative Section */}
                {activeTab === 'creative' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Sparkles className="text-amber-400" /> Creative Efficiency Audit</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {creativeInsights.map((c, i) => (
                         <div key={i} className="p-6 rounded-2xl border bg-[#141824]/40 border-white/5 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold">{c.type}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                c.score === 'High' ? 'bg-green-500/10 text-green-500' : 
                                c.score === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                                'bg-red-500/10 text-red-500'
                              }`}>{c.score}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                               <span className="text-3xl font-black text-white">{c.value}</span>
                               <span className="text-xs text-gray-500 font-medium">{c.metric}</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                               <span className="text-indigo-400 font-bold uppercase text-[10px] mr-1">AI Recommendation:</span> 
                               {c.advice}
                            </p>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* 3. Geo Section */}
                {activeTab === 'geo' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Globe className="text-blue-400" /> Regional Profit Analysis</h3>
                    <div className="rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
                       <table className="w-full text-left">
                          <thead className="bg-white/5">
                             <tr>
                               {['Region', 'Spend Share', 'ROAS', 'Status'].map(h => (
                                 <th key={h} className="p-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">{h}</th>
                               ))}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                             {geoInsights.map((g, i) => (
                               <tr key={i} className="hover:bg-white/[0.02]">
                                  <td className="p-4 text-sm font-bold text-white">{g.region}</td>
                                  <td className="p-4 text-sm text-gray-400 font-medium">{g.spend}</td>
                                  <td className="p-4 text-sm font-black text-indigo-400">{g.roas}</td>
                                  <td className="p-4 text-xs">
                                     <span className={`font-bold ${g.status.includes('Top') ? 'text-green-500' : g.status.includes('Under') ? 'text-red-400' : 'text-gray-400'}`}>
                                       {g.status}
                                     </span>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                    <p className="text-xs text-gray-500 italic text-center">Data aggregated from last 30 days of pixel delivery.</p>
                  </div>
                )}

                {/* 4. Product Section */}
                {activeTab === 'products' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Package className="text-purple-400" /> Cross-Platform Product Winners</h3>
                    <div className="grid gap-3">
                       {productInsights.map((p, i) => (
                         <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">📦</div>
                               <div>
                                  <h4 className="font-bold text-sm">{p.name}</h4>
                                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{p.orders} Direct Orders</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-sm font-black text-indigo-400">{p.roas} ROAS</p>
                               <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${p.trend === 'up' ? 'text-green-500' : 'text-gray-500'}`}>
                                  {p.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                  {p.trend.toUpperCase()} TREND
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                )}

                {/* Macro Plan Footer */}
                <div className="space-y-6 border-t border-white/10 pt-10">
                   <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Strategic Roadmap (Recommended Checklist)</h3>
                      <span className="text-[10px] text-gray-500 font-bold">4 IMMEDIATE ACTIONS</span>
                   </div>
                   
                   <div className="space-y-3">
                      {actionPlan.map((step, i) => (
                        <div key={i} className="group p-4 rounded-2xl border border-indigo-500/10 bg-indigo-500/[0.03] transition-all hover:bg-indigo-500/[0.06] flex items-center justify-between gap-4 cursor-pointer">
                           <div className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500 group-hover:border-indigo-500 transition-all">
                                 <ArrowRight size={12} className="text-indigo-400 group-hover:text-white" />
                              </div>
                              <p className="text-sm font-semibold text-gray-200">{step.label}</p>
                           </div>
                           <div className="text-right">
                              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-md">{step.impact}</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Global Footer */}
        <div className="p-6 border-t border-white/5 bg-[#0D0F14] flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
               <span className="flex items-center gap-1.5"><Target size={12} /> Goal: Maximize Profit</span>
               <span className="w-1 h-1 rounded-full bg-white/20" />
               <span className="flex items-center gap-1.5"><DollarSign size={12} /> Budget: Unconstrained</span>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">Dismiss Report</button>
               <button className="flex items-center gap-3 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-wider">
                  <Zap size={16} /> Execute Roadmap
               </button>
            </div>
        </div>
      </div>
    </div>
  )
}
