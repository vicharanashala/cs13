import { memo, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Loader2, Search, AlertTriangle, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'

type FilterType = 'all' | 'pending' | 'approved' | 'rejected' | 'resolved'
type SortType = 'newest' | 'oldest'

const STATUS_CONFIG = {
  pending:  { label: 'Pending',   dot: '#fbbf24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)',  badge: 'bg-yellow-400/12 text-yellow-400',   icon: Clock },
  approved: { label: 'Approved',  dot: '#22c55e', bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.18)',   badge: 'bg-green-400/12 text-green-400',    icon: CheckCircle },
  rejected: { label: 'Rejected',  dot: '#ef4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.18)',   badge: 'bg-red-400/12 text-red-400',        icon: XCircle },
  resolved: { label: 'Resolved',  dot: '#3b82f6', bg: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.18)',  badge: 'bg-blue-400/12 text-blue-400',      icon: CheckCircle },
}

function RejectionModal({ doubt, onConfirm, onCancel, processing }: {
  doubt: any
  onConfirm: (reason: string) => void
  onCancel: () => void
  processing: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-md p-6"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-base">Reject Doubt</h3>
            <p className="text-white/40 text-xs">This will hide it from all users</p>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-1">Doubt by <span className="text-white/80 font-medium">{doubt.creator_name}</span></p>
        <p className="text-white/40 text-xs line-clamp-2 mb-4 italic">"{doubt.title}"</p>

        <label className="block mb-1 text-white/60 text-xs font-semibold uppercase tracking-wider">
          Rejection Reason <span className="text-red-400/60">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Vague/incomplete doubt, duplicate, off-topic..."
          rows={3}
          className="cosmic-input w-full text-sm resize-none mb-4"
          style={{ borderRadius: '14px' }}
          disabled={processing}
        />

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-white/50 text-sm font-semibold hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            disabled={processing}>Cancel</button>
          <button onClick={() => onConfirm(reason.trim() || 'No reason provided')}
            disabled={processing}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.5)' }}>
            {processing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Confirm Rejection
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export const DoubtModeration = memo(function DoubtModeration() {
  const [doubts, setDoubts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [sort, setSort] = useState<SortType>('newest')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState<number | null>(null)
  const [rejectingDoubt, setRejectingDoubt] = useState<any>(null)

  const fetchDoubts = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await admin.doubts()
      setDoubts(data.doubts || [])
    } catch { toast.error('Failed to load doubts') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchDoubts() }, [fetchDoubts])

  const handleApprove = async (id: number) => {
    setProcessing(id)
    try {
      const { data } = await admin.updateDoubtStatus(id, 'approved')
      setDoubts(prev => prev.map(d => d.id === id ? data.doubt : d))
      toast.success('✅ Doubt approved — now public')
    } catch { toast.error('Failed to approve') }
    setProcessing(null)
  }

  const handleReject = async (reason: string) => {
    if (!rejectingDoubt) return
    setProcessing(rejectingDoubt.id)
    try {
      const { data } = await admin.updateDoubtStatus(rejectingDoubt.id, 'rejected', reason)
      setDoubts(prev => prev.map(d => d.id === rejectingDoubt.id ? data.doubt : d))
      toast.success('✗ Doubt rejected')
    } catch { toast.error('Rejection failed') }
    setProcessing(null)
    setRejectingDoubt(null)
  }

  const handleResolve = async (id: number) => {
    setProcessing(id)
    try {
      const { data } = await admin.updateDoubtStatus(id, 'resolved')
      setDoubts(prev => prev.map(d => d.id === id ? data.doubt : d))
      toast.success('✓ Doubt marked as resolved')
    } catch { toast.error('Failed to resolve') }
    setProcessing(null)
  }

  const handleReset = async (id: number) => {
    setProcessing(id)
    try {
      const { data } = await admin.updateDoubtStatus(id, 'pending')
      setDoubts(prev => prev.map(d => d.id === id ? data.doubt : d))
      toast.success('↩️ Reset to pending')
    } catch { toast.error('Reset failed') }
    setProcessing(null)
  }

  const filtered = doubts
    .filter(d => {
      const matchFilter = filter === 'all' || d.status === filter
      const matchSearch = !search.trim() ||
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.creator_name?.toLowerCase().includes(search.toLowerCase())
      return matchFilter && matchSearch
    })
    .sort((a, b) => {
      const tA = new Date(a.created_at).getTime()
      const tB = new Date(b.created_at).getTime()
      return sort === 'newest' ? tB - tA : tA - tB
    })

  const counts = {
    all:      doubts.length,
    pending:  doubts.filter(d => d.status === 'pending').length,
    approved: doubts.filter(d => d.status === 'approved').length,
    rejected: doubts.filter(d => d.status === 'rejected').length,
    resolved: doubts.filter(d => d.status === 'resolved').length,
  }

  return (
    <>
      <AnimatePresence>
        {rejectingDoubt && (
          <RejectionModal
            doubt={rejectingDoubt}
            processing={processing === rejectingDoubt.id}
            onConfirm={handleReject}
            onCancel={() => { setRejectingDoubt(null); setProcessing(null) }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            Doubt Moderation
          </h1>
          <p className="text-white/35 text-sm mt-1">
            Review submitted doubts · Approve to make public · Rejected doubts stay hidden
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {(['pending', 'approved', 'rejected', 'resolved', 'all'] as FilterType[]).map(s => {
            const cfg = s !== 'all' ? STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] : null
            return (
              <div key={s}
                className="glass-card rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  background: cfg ? cfg.bg : 'rgba(139,92,246,0.06)',
                  border: `1px solid ${cfg ? cfg.border : 'rgba(139,92,246,0.18)'}`,
                  ...(filter === s && s !== 'all' ? { boxShadow: `0 0 20px ${cfg?.dot}22` } : {}),
                }}
                onClick={() => setFilter(s)}>
                {cfg && <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }} />}
                {!cfg && <div className="w-2 h-2 rounded-full bg-[#7c3aed]" />}
                <div>
                  <p className="text-white/40 text-xs">{s === 'all' ? 'Total' : (cfg?.label || s)}</p>
                  <p className="text-white font-bold text-lg">{counts[s]}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['newest', 'oldest'] as SortType[]).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${sort === s ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'}`}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search doubts, users..."
              className="cosmic-input pl-9 text-xs"
              style={{ borderRadius: '14px', paddingLeft: '36px' }} />
          </div>
        </div>

        {/* Doubt Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <MessageSquare size={24} className="text-white/20" />
            </div>
            <p className="text-white/40 text-sm">No doubts match this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((doubt, i) => {
                const cfg = STATUS_CONFIG[doubt.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
                const isProcessing = processing === doubt.id
                const canAct = doubt.status === 'pending'

                return (
                  <motion.div
                    key={doubt.id}
                    className="glass-card rounded-2xl p-5"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                          <span className="text-white/25 text-xs">by {doubt.creator_name || 'Unknown'}</span>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="text-white/30 text-xs">{new Date(doubt.created_at).toLocaleDateString()}</span>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="text-[#7c3aed]/70 text-xs">{doubt.category}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-white font-medium text-base mb-1.5">{doubt.title}</h3>

                        {/* Body */}
                        <p className="text-white/60 text-sm leading-relaxed mb-3 line-clamp-2">{doubt.body}</p>

                        {/* Footer */}
                        <div className="flex items-center gap-3">
                          {doubt.status === 'rejected' && doubt.rejection_reason && (
                            <span className="text-red-400/50 text-xs italic">✗ {doubt.rejection_reason}</span>
                          )}
                          {doubt.status === 'pending' && (
                            <span className="text-yellow-400/50 text-xs">⏳ Awaiting review</span>
                          )}
                          {doubt.status === 'approved' && (
                            <span className="text-green-400/50 text-xs">✓ Public</span>
                          )}
                          {doubt.status === 'resolved' && (
                            <span className="text-blue-400/50 text-xs">✓ Resolved</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {isProcessing ? (
                          <Loader2 size={16} className="text-white/30 animate-spin mx-auto" />
                        ) : canAct ? (
                          <>
                            <motion.button
                              onClick={() => handleApprove(doubt.id)}
                              className="cosmic-btn-approve"
                              whileTap={{ scale: 0.92 }}
                              title="Approve — make public"
                            >
                              <CheckCircle size={13} /> Approve
                            </motion.button>
                            <motion.button
                              onClick={() => setRejectingDoubt(doubt)}
                              className="cosmic-btn-reject"
                              whileTap={{ scale: 0.92 }}
                              title="Reject — keep hidden"
                            >
                              <XCircle size={13} /> Reject
                            </motion.button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-center w-20 h-10 rounded-xl"
                              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                              {doubt.status === 'approved' && <CheckCircle size={16} className="text-green-400" />}
                              {doubt.status === 'rejected' && <XCircle size={16} className="text-red-400" />}
                              {doubt.status === 'resolved' && <CheckCircle size={16} className="text-blue-400" />}
                            </div>
                            <button onClick={() => handleReset(doubt.id)}
                              className="text-white/25 text-xs hover:text-white/60 transition-colors"
                              title="Reset to pending">
                              ↩ reset
                            </button>
                            {doubt.status === 'approved' && (
                              <button onClick={() => handleResolve(doubt.id)}
                                className="text-blue-400/50 text-xs hover:text-blue-400 transition-colors"
                                title="Mark resolved">
                                ↻ resolve
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  )
})
export default DoubtModeration