import { memo, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Crown, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'

interface User {
  id: number
  username: string
  role: string
  created_at?: string
}

export const UserManagement = memo(function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    admin.users()
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users
    .filter(u => !search.trim() || u.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.username.localeCompare(b.username))

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl text-white font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
          User Management
        </h1>
        <p className="text-white/35 text-sm mt-1">View and manage registered users</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: '#ec4899' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: '#7c3aed' },
        ].map(({ label, value, color }, i) => (
          <motion.div key={label} className="glass-card rounded-2xl p-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Users size={14} style={{ color }} />
              </div>
              <p className="text-white/40 text-xs">{label}</p>
            </div>
            <p className="text-white text-2xl font-bold">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="cosmic-input pl-9 text-xs"
            style={{ borderRadius: '14px', paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Users size={28} className="text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No users found</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/[0.06]"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="col-span-1 text-white/30 text-xs font-semibold uppercase tracking-widest">#</div>
            <div className="col-span-5 text-white/30 text-xs font-semibold uppercase tracking-widest">User</div>
            <div className="col-span-4 text-white/30 text-xs font-semibold uppercase tracking-widest">Role</div>
            <div className="col-span-2 text-white/30 text-xs font-semibold uppercase tracking-widest">Joined</div>
          </div>

          {filtered.map((user, i) => (
            <motion.div
              key={user.id}
              className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              {/* Index */}
              <div className="col-span-1 text-white/25 text-xs">{i + 1}</div>

              {/* User info */}
              <div className="col-span-5 flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    background: `hsl(${(user.username.charCodeAt(0) * 7) % 360}, 60%, 25%)`,
                    color: `hsl(${(user.username.charCodeAt(0) * 7) % 360}, 80%, 70%)`,
                  }}
                >
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-white text-sm font-medium">{user.username}</span>
              </div>

              {/* Role */}
              <div className="col-span-4">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  user.role === 'admin'
                    ? 'bg-[#7c3aed]/20 text-[#a78bfa]'
                    : 'bg-white/8 text-white/50'
                }`}>
                  {user.role === 'admin' && <Crown size={10} />}
                  {user.role}
                </span>
              </div>

              {/* Joined */}
              <div className="col-span-2">
                <span className="text-white/30 text-xs">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
})
export default UserManagement