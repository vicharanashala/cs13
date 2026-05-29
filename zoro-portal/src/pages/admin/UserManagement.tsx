import { memo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Crown, TrendingUp, Loader2, Search, History, X, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'

interface SPHistoryItem {
  id: number
  amount: number
  reason: string
  moderator_name: string
  answer_preview: string
  created_at: string
}

interface User {
  id: number
  username: string
  sp_points: number
  role: string
  created_at?: string
}

function SPHistoryModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [history, setHistory] = useState<SPHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    admin.spHistory(user.id)
      .then(({ data }) => setHistory(data.history || []))
      .catch(() => toast.error('Failed to load SP history'))
      .finally(() => setLoading(false))
  }, [user.id])

  const totalEarned = history.filter(h => h.amount > 0).reduce((s, h) => s + h.amount, 0)
  const totalRevoked = Math.abs(history.filter(h => h.amount < 0).reduce((s, h) => s + h.amount, 0))

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-lg max-h-[80vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ border: '1px solid rgba(139,92,246,0.3)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold"
              style={{
                background: `hsl(${(user.username.charCodeAt(0) * 7) % 360}, 60%, 25%)`,
                color: `hsl(${(user.username.charCodeAt(0) * 7) % 360}, 80%, 70%)`,
              }}>
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{user.username}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-yellow-400 text-xs font-bold">{user.sp_points} SP</span>
                {history.length > 0 && (
                  <span className="text-white/25 text-xs">· {history.length} transactions</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 p-4 border-b border-white/[0.06]">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <ArrowUpRight size={14} className="text-green-400 mx-auto mb-1" />
              <p className="text-white text-sm font-bold">+{totalEarned} SP</p>
              <p className="text-white/30 text-xs">earned</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <ArrowDownRight size={14} className="text-red-400 mx-auto mb-1" />
              <p className="text-white text-sm font-bold">-{totalRevoked} SP</p>
              <p className="text-white/30 text-xs">revoked</p>
            </div>
          </div>
        )}

        {/* History list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="text-[#7c3aed] animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <History size={28} className="text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">No SP history yet</p>
            </div>
          ) : (
            history.map((item, i) => {
              const isEarned = item.amount > 0
              return (
                <motion.div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isEarned ? 'bg-green-400/15 text-green-400' : 'bg-red-400/15 text-red-400'
                  }`}>
                    {isEarned ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-bold ${isEarned ? 'text-green-400' : 'text-red-400'}`}>
                        {isEarned ? '+' : ''}{item.amount} SP
                      </span>
                      <span className="text-white/25 text-xs">by {item.moderator_name || 'System'}</span>
                      <span className="text-white/20 text-xs ml-auto flex-shrink-0">
                        {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs italic leading-relaxed">{item.reason}</p>
                    {item.answer_preview && (
                      <p className="text-white/20 text-xs mt-1 truncate italic">Re: "{item.answer_preview}"</p>
                    )}
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export const UserManagement = memo(function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'sp_points' | 'username'>('sp_points')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    admin.users()
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users
    .filter(u => !search.trim() || u.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'sp_points' ? b.sp_points - a.sp_points : a.username.localeCompare(b.username))

  const totalSP = users.reduce((sum, u) => sum + u.sp_points, 0)
  const avgSP = users.length ? Math.round(totalSP / users.length) : 0

  const rankMedal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `#${i + 1}`

  return (
    <>
      <AnimatePresence>
        {selectedUser && (
          <SPHistoryModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>

      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            Users & SP Management
          </h1>
          <p className="text-white/35 text-sm mt-1">Manage skill points and view user activity</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: '#ec4899' },
            { label: 'Total SP in Circulation', value: totalSP, icon: TrendingUp, color: '#fbbf24' },
            { label: 'Average SP', value: avgSP, icon: Crown, color: '#7c3aed' },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} className="glass-card rounded-2xl p-4"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <p className="text-white/40 text-xs">{label}</p>
              </div>
              <p className="text-white text-2xl font-bold">{value.toLocaleString()} <span className="text-white/30 text-sm font-normal">SP</span></p>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="cosmic-input pl-9 text-xs"
              style={{ borderRadius: '14px', paddingLeft: '36px' }} />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setSortBy('sp_points')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'sp_points' ? 'bg-[#7c3aed] text-white' : 'text-white/40'}`}>
              Rank by SP
            </button>
            <button onClick={() => setSortBy('username')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${sortBy === 'username' ? 'bg-[#7c3aed] text-white' : 'text-white/40'}`}>
              A–Z
            </button>
          </div>
        </div>

        {/* User Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/[0.06]"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="col-span-1 text-white/30 text-xs font-semibold uppercase tracking-widest">Rank</div>
              <div className="col-span-4 text-white/30 text-xs font-semibold uppercase tracking-widest">User</div>
              <div className="col-span-3 text-white/30 text-xs font-semibold uppercase tracking-widest">Role</div>
              <div className="col-span-3 text-white/30 text-xs font-semibold uppercase tracking-widest text-right">SP</div>
              <div className="col-span-1" />
            </div>

            {filtered.length === 0 ? (
              <div className="p-12 text-center text-white/30 text-sm">No users found</div>
            ) : (
              filtered.map((user, i) => {
                const isTop3 = i < 3
                return (
                  <motion.div
                    key={user.id}
                    className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {/* Rank */}
                    <div className="col-span-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'glow-gold bg-[#FFD700]/15 text-[#FFD700]' :
                        i === 1 ? 'bg-[#C0C0C0]/15 text-[#C0C0C0]' :
                        i === 2 ? 'bg-[#CD7F32]/15 text-[#CD7F32]' :
                        'bg-white/5 text-white/40'
                      }`}>
                        {rankMedal(i)}
                      </div>
                    </div>

                    {/* User */}
                    <div className="col-span-4 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `hsl(${(user.username.charCodeAt(0) * 7) % 360}, 60%, 25%)`,
                          color: `hsl(${(user.username.charCodeAt(0) * 7) % 360}, 80%, 70%)`,
                        }}>
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{user.username}</p>
                        {user.created_at && (
                          <p className="text-white/25 text-xs">Since {new Date(user.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="col-span-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        user.role === 'admin'
                          ? 'bg-[#7c3aed]/20 text-[#a78bfa]'
                          : 'bg-white/8 text-white/50'
                      }`}>
                        {user.role === 'admin' && <Crown size={10} />}
                        {user.role}
                      </span>
                    </div>

                    {/* SP */}
                    <div className="col-span-3 text-right flex items-center justify-end gap-2">
                      <span className={`text-base font-bold ${isTop3 ? 'text-yellow-400' : 'text-white'}`}>
                        {user.sp_points.toLocaleString()}
                      </span>
                      <span className="text-yellow-400/60 text-xs">SP</span>
                    </div>

                    {/* History button */}
                    <div className="col-span-1 flex justify-end">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-[#a78bfa] hover:bg-[#7c3aed]/15 transition-all"
                        title="View SP history"
                      >
                        <History size={13} />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )
})
export default UserManagement