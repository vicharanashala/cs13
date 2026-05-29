import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowUpRight, ArrowDownRight, Clock, Loader2, Search, Filter, TrendingUp, Coins } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Transaction {
  id: number
  user_id: number
  target_user: string
  answer_id: number
  answer_preview: string
  amount: number
  reason: string
  moderator_name: string
  created_at: string
}

const CHART_COLORS = {
  line: '#a78bfa',
  grid: 'rgba(255,255,255,0.05)',
  text: 'rgba(255,255,255,0.4)',
  tooltip: 'rgba(15,10,30,0.95)',
}

export const SPTransactions = memo(function SPTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'earned' | 'revoked'>('all')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      admin.spTransactions(),
      admin.spStats(),
    ]).then(([{ data: txData }, { data: statsData }]) => {
      setTransactions(txData.transactions || [])
      setStats(statsData)
    }).catch(() => toast.error('Failed to load SP data'))
    .finally(() => setLoading(false))
  }, [])

  const filtered = transactions.filter(t => {
    const matchType = typeFilter === 'all' || (typeFilter === 'earned' ? t.amount > 0 : t.amount < 0)
    const matchSearch = !search.trim() ||
      t.target_user?.toLowerCase().includes(search.toLowerCase()) ||
      t.reason?.toLowerCase().includes(search.toLowerCase()) ||
      t.moderator_name?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalRevoked = Math.abs(transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))

  // Build sparkline data (last 10 earn transactions grouped by date)
  const chartData = transactions
    .filter(t => t.amount > 0)
    .slice(0, 10)
    .reverse()
    .map(t => ({
      date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sp: t.amount,
      user: t.target_user,
    }))

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
          SP Transactions
        </h1>
        <p className="text-white/35 text-sm mt-1">Complete audit trail of all SP awards and revocations</p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins size={14} className="text-yellow-400" />
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Total SP</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalSP.toLocaleString()}</p>
            <p className="text-white/30 text-xs mt-0.5">in circulation</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight size={14} className="text-green-400" />
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Awarded</span>
            </div>
            <p className="text-2xl font-bold text-green-400">+{totalEarned}</p>
            <p className="text-white/30 text-xs mt-0.5">{stats.totalAwards} transactions</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight size={14} className="text-red-400" />
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Revoked</span>
            </div>
            <p className="text-2xl font-bold text-red-400">-{totalRevoked}</p>
            <p className="text-white/30 text-xs mt-0.5">{stats.totalDeducted} revocations</p>
          </div>
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-[#a78bfa]" />
              <span className="text-white/40 text-xs uppercase tracking-wider font-semibold">Per Approve</span>
            </div>
            <p className="text-2xl font-bold text-[#a78bfa]">+{stats.SP_APPROVAL_REWARD}</p>
            <p className="text-white/30 text-xs mt-0.5">SP per approved answer</p>
          </div>
        </div>
      )}

      {/* Sparkline */}
      {chartData.length > 1 && (
        <div className="glass-card rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Recent SP Awards</h3>
              <p className="text-white/25 text-xs mt-0.5">Last {chartData.length} approved answers</p>
            </div>
            <TrendingUp size={16} className="text-[#a78bfa]" />
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: CHART_COLORS.text, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: CHART_COLORS.tooltip, border: '1px solid rgba(167,139,250,0.3)', borderRadius: '12px', fontSize: 12 }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                itemStyle={{ color: CHART_COLORS.line }}
                formatter={(v: any, _n: any, _i: any, props: any) => [`+${v} SP · ${props.payload.user}`, 'Awarded']}
              />
              <Line type="monotone" dataKey="sp" stroke={CHART_COLORS.line} strokeWidth={2}
                dot={{ fill: CHART_COLORS.line, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: CHART_COLORS.line }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([['all', 'All Transactions'], ['earned', 'Earned'], ['revoked', 'Revoked']] as [string, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTypeFilter(key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === key ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 max-w-xs relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search user, reason..."
            className="cosmic-input pl-9 text-xs"
            style={{ borderRadius: '14px', paddingLeft: '36px' }} />
        </div>
      </div>

      {/* Transaction List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)' }}>
            <Zap size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No transactions yet</p>
          <p className="text-white/20 text-xs mt-1">Approve some answers to start awarding SP!</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((tx, i) => {
              const isEarned = tx.amount > 0
              const date = new Date(tx.created_at)
              const isToday = date.toDateString() === new Date().toDateString()

              return (
                <motion.div
                  key={tx.id}
                  className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isEarned ? 'bg-green-400/10 border border-green-400/20' : 'bg-red-400/10 border border-red-400/20'
                  }`}>
                    {isEarned
                      ? <ArrowUpRight size={18} className="text-green-400" />
                      : <ArrowDownRight size={18} className="text-red-400" />}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-white/80 text-sm font-medium">{tx.target_user || `User #${tx.user_id}`}</span>
                      <span className={`text-xs font-bold ${isEarned ? 'text-green-400' : 'text-red-400'}`}>
                        {isEarned ? '+' : ''}{tx.amount} SP
                      </span>
                      {!isEarned && (
                        <span className="text-white/20 text-xs">(revoked)</span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs italic truncate">{tx.reason}</p>
                  </div>

                  {/* Moderator */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-white/30 text-xs">{isEarned ? 'by' : 'revoked by'}</p>
                    <p className="text-white/50 text-xs">{tx.moderator_name || 'System'}</p>
                    <p className="text-white/20 text-xs mt-0.5">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
})
export default SPTransactions