import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollText, Loader2, CheckCircle, XCircle, Clock, RotateCcw, Zap, CheckCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'

const ACTION_CONFIG: Record<string, { label: string; dot: string; color: string; icon: any }> = {
  approved:       { label: 'Approved',     dot: '#22c55e', color: 'text-green-400',  icon: CheckCircle },
  rejected:       { label: 'Rejected',     dot: '#ef4444', color: 'text-red-400',    icon: XCircle },
  reset_pending:  { label: 'Reset',        dot: '#6b7280', color: 'text-gray-400',   icon: RotateCcw },
  sp_revoked:     { label: 'SP Revoked',   dot: '#f59e0b', color: 'text-yellow-400', icon: Zap },
  resolved:       { label: 'Resolved',     dot: '#3b82f6', color: 'text-blue-400',   icon: CheckCheck },
}

interface ModLog {
  id: number
  moderator_id: number
  moderator_name: string
  target_type: 'answer' | 'doubt'
  target_id: number
  action: string
  detail: string
  sp_delta: number
  created_at: string
}

export const ModLogs = memo(function ModLogs() {
  const [logs, setLogs] = useState<ModLog[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'answer' | 'doubt'>('all')

  useEffect(() => {
    admin.moderationLogs()
      .then(({ data }) => setLogs(data.logs || []))
      .catch(() => toast.error('Failed to load moderation logs'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = typeFilter === 'all' ? logs : logs.filter(l => l.target_type === typeFilter)

  const grouped = filtered.reduce((acc: Record<string, ModLog[]>, log) => {
    const date = new Date(log.created_at).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
          Moderation Logs
        </h1>
        <p className="text-white/35 text-sm mt-1">Complete audit trail of all moderation actions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-xl p-4" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-white/40 text-xs mb-1">Total Actions</p>
          <p className="text-white text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4" style={{ border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-white/40 text-xs mb-1">Answers</p>
          <p className="text-white text-2xl font-bold">{logs.filter(l => l.target_type === 'answer').length}</p>
        </div>
        <div className="glass-card rounded-xl p-4" style={{ border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-white/40 text-xs mb-1">Doubts</p>
          <p className="text-white text-2xl font-bold">{logs.filter(l => l.target_type === 'doubt').length}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {([['all', 'All'], ['answer', 'Answers'], ['doubt', 'Doubts']] as [string, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setTypeFilter(k as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === k ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <ScrollText size={28} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No moderation logs yet</p>
          <p className="text-white/20 text-xs mt-1">Actions will appear here once admin decisions are made</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.3))' }} />
                <div className="flex items-center gap-2 text-white/40 text-xs font-semibold uppercase tracking-widest">
                  <Clock size={12} />
                  {date}
                </div>
                <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.3), transparent)' }} />
              </div>

              <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
                <AnimatePresence>
                  {dayLogs.map((log, i) => {
                    const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.reset_pending
                    const Icon = cfg.icon
                    const isToday = new Date(log.created_at).toDateString() === new Date().toDateString()
                    return (
                      <motion.div
                        key={log.id}
                        className="glass-card rounded-2xl p-4 flex items-start gap-4"
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}
                      >
                        {/* Icon */}
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${cfg.dot}15`, border: `1px solid ${cfg.dot}30` }}>
                          <Icon size={16} className={cfg.color} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <span className={`text-xs font-bold uppercase ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-white/40 text-xs">a {log.target_type}</span>
                            <span className="text-white/20 text-xs">by {log.moderator_name || 'System'}</span>
                            {log.sp_delta !== 0 && (
                              <span className={`text-xs font-bold ${log.sp_delta > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {log.sp_delta > 0 ? '+' : ''}{log.sp_delta} SP
                              </span>
                            )}
                          </div>
                          <p className="text-white/50 text-sm leading-relaxed">{log.detail}</p>
                          <p className="text-white/20 text-xs mt-1">
                            {isToday
                              ? `Today at ${new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                              : new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            }
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
export default ModLogs