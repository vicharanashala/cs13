import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Users, HelpCircle, TrendingUp, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { admin } from '../../lib/api'

interface Stats {
  total: number; resolved: number; pending: number
  feedback: number; users: number; faqs: number
}


interface PendingItem { id: number; type: string; title: string; body: string; creator_name: string; created_at: string }

const STAT_CARDS = [
  { label: 'Total Doubts',    key: 'total',    Icon: MessageSquare, color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
  { label: 'Pending Review',  key: 'pending',  Icon: Clock,         color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  { label: 'Resolved',        key: 'resolved', Icon: CheckCircle,   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { label: 'Feedback',        key: 'feedback', Icon: TrendingUp,    color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  { label: 'Users',           key: 'users',    Icon: Users,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  { label: 'FAQs',            key: 'faqs',     Icon: HelpCircle,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
]

export const AdminDashboard = memo(function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ total: 0, resolved: 0, pending: 0, feedback: 0, users: 0, faqs: 0 })
  const [recentPending, setRecentPending] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      admin.stats(),
      admin.listAnswers(),
    ]).then(([{ data }, { data: ansData }]) => {
      setStats(data)
      const pending = (ansData.answers || []).filter((a: any) => a.status === 'pending')
      setRecentPending(pending.slice(0, 5))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
          Moderation Dashboard
        </h1>
        <p className="text-white/35 text-sm mt-1">Overview of portal activity and pending reviews</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {STAT_CARDS.map(({ label, key, Icon, color, bg }, i) => (
          <motion.div
            key={key}
            className="glass-card rounded-2xl p-4 relative overflow-hidden"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
              style={{ background: color, filter: 'blur(20px)', transform: 'translate(30%,-30%)' }} />
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <p className="text-white/30 text-xs mb-1">{label}</p>
            <p className="text-white text-2xl font-bold">{loading ? '—' : (stats as any)[key] ?? 0}</p>
          </motion.div>
        ))}
      </div>

      {/* Two-column bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-yellow-400" />
              <h3 className="text-white font-semibold text-sm">Pending Reviews</h3>
              {recentPending.length > 0 && (
                <span className="bg-yellow-400/15 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  {recentPending.length}
                </span>
              )}
            </div>
            <button onClick={() => navigate('/admin-x9k2/moderation')}
              className="flex items-center gap-1 text-[#7c3aed] text-xs font-medium hover:text-white transition-colors">
              View all <ArrowRight size={12} />
            </button>
          </div>

          {recentPending.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle size={32} className="text-green-400/40 mx-auto mb-2" />
              <p className="text-white/30 text-sm">All caught up — no pending items</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPending.map((item: any, i) => (
                <motion.div key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.12)' }}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-yellow-400/70 text-xs font-medium">{item.creator_name}</span>
                      <span className="text-white/15 text-xs">·</span>
                      <span className="text-white/25 text-xs">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-white/70 text-xs truncate">{item.body || item.title}</p>
                  </div>
                  <span className="bg-yellow-400/10 text-yellow-400 text-xs px-2 py-0.5 rounded-full flex-shrink-0">Answer</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#7c3aed]" />
            <h3 className="text-white font-semibold text-sm">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Review Pending', sub: `${recentPending.length} to review`, color: '#fbbf24', action: () => navigate('/admin-x9k2/moderation') },
              { label: 'Manage FAQs', sub: `${stats.faqs} total`, color: '#7c3aed', action: () => navigate('/admin-x9k2/moderation') },
              { label: 'User Activity', sub: `${stats.users} users`, color: '#ec4899', action: () => navigate('/admin-x9k2/users') },
              { label: 'Mod Logs', sub: 'View history', color: '#06b6d4', action: () => navigate('/admin-x9k2/logs') },
            ].map(({ label, sub, color, action }) => (
              <motion.button key={label} onClick={action}
                className="text-left p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: `${color}10`, border: `1px solid ${color}25` }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="w-2 h-2 rounded-full mb-2" style={{ background: color }} />
                <p className="text-white text-sm font-medium">{label}</p>
                <p className="text-white/30 text-xs mt-0.5">{sub}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
export default AdminDashboard
