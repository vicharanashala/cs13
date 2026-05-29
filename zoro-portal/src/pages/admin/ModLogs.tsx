import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ScrollText, CheckCircle, XCircle, Clock, Loader2, Search, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'

interface ModLog {
  id: number
  action: 'approved' | 'rejected' | 'created' | 'resolved' | 'upvoted' | 'commented'
  target_type: 'answer' | 'doubt' | 'faq' | 'announcement'
  target_id: number
  target_preview: string
  moderator_name: string
  sp_delta?: number
  created_at: string
}


const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  approved:   { label: 'Approved',  color: '#22c55e', icon: CheckCircle, bg: 'rgba(34,197,94,0.1)' },
  rejected:   { label: 'Rejected',  color: '#ef4444', icon: XCircle, bg: 'rgba(239,68,68,0.1)' },
  created:    { label: 'Created',   color: '#7c3aed', icon: Activity, bg: 'rgba(124,58,237,0.1)' },
  resolved:   { label: 'Resolved',  color: '#06b6d4', icon: CheckCircle, bg: 'rgba(6,182,212,0.1)' },
  upvoted:    { label: 'Upvoted',   color: '#fbbf24', icon: Activity, bg: 'rgba(251,191,36,0.1)' },
  commented:  { label: 'Commented', color: '#a78bfa', icon: Activity, bg: 'rgba(167,139,250,0.1)' },
}


const TYPE_ICONS: Record<string, string> = {
  answer: '💬', doubt: '❓', faq: '📋', announcement: '📢'
}


export const ModLogs = memo(function ModLogs() {
  const [logs, setLogs] = useState<ModLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')

  useEffect(() => {
    // Build mock logs from existing moderation data
    Promise.all([
      admin.listAnswers(),
      admin.doubts(),
      admin.stats(),
    ]).then(([{ data: ansData }, { data: doubtData }]) => {
      const entries: ModLog[] = []
      const now = Date.now()

      // Build from answers
      ;(ansData.answers || []).forEach((a: any, idx: number) => {
        entries.push({
          id: 1000 + idx,
          action: a.status === 'approved' ? 'approved' : a.status === 'rejected' ? 'rejected' : 'created',
          target_type: 'answer',
          target_id: a.id,
          target_preview: a.body?.slice(0, 80) + '...',
          moderator_name: a.creator_name,
          sp_delta: a.status === 'approved' ? 10 : undefined,
          created_at: a.created_at || new Date(now - idx * 3600000 * 2).toISOString(),
        })
      })

      // Build from doubts
      ;(doubtData.doubts || []).forEach((d: any, idx: number) => {
        if (d.status === 'resolved') {
          entries.push({
            id: 2000 + idx,
            action: 'resolved',
            target_type: 'doubt',
            target_id: d.id,
            target_preview: d.title,
            moderator_name: d.creator_name,
            created_at: d.updated_at || d.created_at || new Date(now - idx * 3600000).toISOString(),
          })
        }
      })

      // Sort by newest first
      entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setLogs(entries)
    }).catch(() => toast.error('Failed to load logs'))
    .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const matchAction = actionFilter === 'all' || l.action === actionFilter
    const matchSearch = !search.trim() ||
      l.target_preview.toLowerCase().includes(search.toLowerCase()) ||
      l.moderator_name.toLowerCase().includes(search.toLowerCase())
    return matchAction && matchSearch
  })

  const todayLogs = logs.filter(l => {
    const d = new Date(l.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
          Moderation Logs
        </h1>
        <p className="text-white/35 text-sm mt-1">
          {logs.length} total actions · {todayLogs} today
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['all', 'approved', 'rejected', 'resolved'].map(action => (
            <button key={action} onClick={() => setActionFilter(action)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                actionFilter === action ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'
              }`}>
              {action === 'all' ? 'All' : ACTION_CONFIG[action]?.label ?? action}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            className="cosmic-input pl-9 text-xs"
            style={{ borderRadius: '14px', paddingLeft: '36px' }} />
        </div>
      </div>

      {/* Log timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <ScrollText size={24} className="text-white/20" />
          </div>
          <p className="text-white/40 text-sm">No moderation activity yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.4), rgba(6,182,212,0.2), transparent)' }} />

          <div className="space-y-3">
            {filtered.map((log, i) => {
              const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG.created
              const Icon = cfg.icon
              const isToday = new Date(log.created_at).toDateString() === new Date().toDateString()

              return (
                <motion.div
                  key={log.id}
                  className="glass-card rounded-2xl p-4 ml-12 relative"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[42px] top-5 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: cfg.bg, border: `2px solid ${cfg.color}60` }}>
                    <Icon size={11} style={{ color: cfg.color }} />
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                          <Icon size={10} /> {cfg.label}
                        </span>
                        <span className="text-white/30 text-xs">
                          {TYPE_ICONS[log.target_type] ?? '📌'} {log.target_type}
                        </span>
                        <span className="text-white/25 text-xs">by</span>
                        <span className="text-white/50 text-xs font-medium">{log.moderator_name}</span>
                        {isToday && (
                          <span className="text-[#06b6d4] text-xs">· Today</span>
                        )}
                        {!isToday && (
                          <span className="text-white/25 text-xs">· {new Date(log.created_at).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Target preview */}
                      <p className="text-white/60 text-xs leading-relaxed truncate italic">
                        "{log.target_preview}"
                      </p>

                      {/* SP delta */}
                      {log.sp_delta !== undefined && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-yellow-400/80 text-xs font-semibold flex items-center gap-1">
                            ⚡ {log.sp_delta > 0 ? '+' : ''}{log.sp_delta} SP
                          </span>
                          <span className="text-white/25 text-xs">awarded to {log.moderator_name}</span>
                        </div>
                      )}
                    </div>

                    {/* ID badge */}
                    <span className="text-white/15 text-xs flex-shrink-0">#{log.id}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
})
export default ModLogs
