import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, MessageSquare, Users, ScrollText, Megaphone, LogOut, Shield, ChevronRight, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/admin-x9k2',            label: 'Dashboard',     Icon: BarChart3,       end: true },
  { to: '/admin-x9k2/moderation', label: 'Moderation',   Icon: MessageSquare },
  { to: '/admin-x9k2/users',      label: 'Users & SP',   Icon: Users },
  { to: '/admin-x9k2/logs',  label: 'Mod Logs',     Icon: ScrollText },
  { to: '/admin-x9k2/sp',      label: 'SP Transactions', Icon: Zap },
]

export const AdminSidebar = memo(function AdminSidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 flex flex-col z-40"
      style={{
        background: 'rgba(6,5,18,0.95)',
        backdropFilter: 'blur(32px)',
        borderRight: '1px solid rgba(139,92,246,0.15)',
      }}>

      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 flex items-center justify-center">
            <Shield size={16} className="text-[#7c3aed]" />
          </div>
          <span className="text-white font-bold text-sm tracking-wide">Zoro Admin</span>
        </div>
        <p className="text-white/25 text-xs ml-0.5">Portal Control Center</p>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)' }} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-white/20 text-xs font-semibold uppercase tracking-widest px-2 mb-3">Navigation</p>
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-link relative ${isActive ? 'text-white' : 'text-white/50 hover:text-white/80'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <div className="nav-pill-active" />}
                <Icon size={15} className={isActive ? 'text-[#7c3aed]' : ''} />
                <span className="text-xs font-medium">{label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto text-white/30" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <div className="mx-1 mb-3 px-3 py-2.5 rounded-xl"
          style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.12)' }}>
          <p className="text-white/60 text-xs font-medium">{user?.username}</p>
          <p className="text-[#7c3aed] text-xs font-semibold capitalize">{user?.role}</p>
        </div>
        <button onClick={handleLogout}
          className="nav-link w-full text-red-400/70 hover:text-red-400">
          <LogOut size={15} />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
})