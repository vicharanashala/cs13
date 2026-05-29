import { memo, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, Loader2, Search, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { admin } from '../../lib/api'

type FilterType = 'all' | 'pending' | 'approved' | 'rejected'

const STATUS_CONFIG = {
  pending:  { label: 'Pending',   dot: '#fbbf24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.18)',  badge: 'bg-yellow-400/12 text-yellow-400',   icon: Clock },
  approved: { label: 'Approved',  dot: '#22c55e', bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.18)',   badge: 'bg-green-400/12 text-green-400',    icon: CheckCircle },
  rejected: { label: 'Rejected',  dot: '#ef4444', bg: 'rgba(239,68,68,0.06)',   border: 'rgba(239,68,68,0.18)',   badge: 'bg-red-400/12 text-red-400',        icon: XCircle },
}

interface Answer {
  id: number
  body: string
  creator_name: string
  doubt_id: number
  doubt_title: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  created_at: string
}

function RejectionModal({ answer, onConfirm, onCancel, processing }: {
  answer: Answer
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
            <h3 className="text-white font-bold text-base">Reject Answer</h3>
            <p className="text-white/40 text-xs">This answer will be hidden from students</p>
          </div>
        </div>

        <p className="text-white/60 text-sm mb-1">Answer by <span className="text-white/80 font-medium">{answer.creator_name}</span></p>
        <p className="text-white/40 text-xs line-clamp-2 mb-4 italic">"{answer.body?.slice(0, 100)}"</p>

        <label className="block mb-1 text-white/60 text-xs font-semibold uppercase tracking-wider">
          Rejection Reason <span className="text-red-400/60">(optional)</span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Incomplete answer, incorrect info, off-topic..."
          rows={3}
          className="cosmic-input w-full text-sm resize-none mb-4"
          style={{ borderRadius: '14px' }}
          disabled={processing}
        />

        <div className="flex items-center gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-white/50 text-sm font-semibold hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }} disabled={processing}>
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim() || 'No reason provided')}
            disabled={processing}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.8)', border: '1px solid rgba(239,68,68,0.5)' }}
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Confirm Rejection
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export const AnswerModeration = memo(function AnswerModeration() {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('pending')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState<number | null>(null)
  const [rejectingAnswer, setRejectingAnswer] = useState<Answer | null>(null)

  const fetchAnswers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await admin.listAnswers()
      setAnswers(data.answers || [])
    } catch { toast.error('Failed to load answers') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAnswers() }, [fetchAnswers])

  const handleApprove = async (id: number) => {
    setProcessing(id)
    try {
      const { data } = await admin.updateAnswerStatus(id, 'approved')
      setAnswers(prev => prev.map(a => a.id === id ? data.answer : a))
      toast.success('✅ Answer approved — now visible to students')
    } catch {
      toast.error('Failed to approve')
    }
    setProcessing(null)
  }

  const handleReject = async (reason: string) => {
    if (!rejectingAnswer) return
    setProcessing(rejectingAnswer.id)
    try {
      const { data } = await admin.updateAnswerStatus(rejectingAnswer.id, 'rejected', reason)
      setAnswers(prev => prev.map(a => a.id === rejectingAnswer.id ? data.answer : a))
      toast.success('✗ Answer rejected')
    } catch { toast.error('Rejection failed') }
    setProcessing(null)
    setRejectingAnswer(null)
  }

  const handleReset = async (id: number) => {
    setProcessing(id)
    try {
      const { data } = await admin.updateAnswerStatus(id, 'pending')
      setAnswers(prev => prev.map(a => a.id === id ? data.answer : a))
      toast.success('↩️ Reset to pending')
    } catch { toast.error('Reset failed') }
    setProcessing(null)
  }

  const filtered = answers.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter
    const matchSearch = !search.trim() ||
      a.body.toLowerCase().includes(search.toLowerCase()) ||
      a.creator_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doubt_title?.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    all: answers.length,
    pending:  answers.filter(a => a.status === 'pending').length,
    approved: answers.filter(a => a.status === 'approved').length,
    rejected: answers.filter(a => a.status === 'rejected').length,
  }

  return (
    <>
      <AnimatePresence>
        {rejectingAnswer && (
          <RejectionModal
            answer={rejectingAnswer}
            processing={processing === rejectingAnswer.id}
            onConfirm={handleReject}
            onCancel={() => { setRejectingAnswer(null); setProcessing(null) }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
            Answer Moderation
          </h1>
          <p className="text-white/35 text-sm mt-1">
            Review community answers · Approve to make public · Reject with optional reason
          </p>
        </div>

        {/* Filter + Search */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map(f => {
              const cfg = f !== 'all' ? STATUS_CONFIG[f] : null
              const active = filter === f
              return (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    active ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'
                  }`}>
                  {cfg && <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />}
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-white/8'}`}>
                    {counts[f]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex-1 max-w-xs relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search answers, users, doubts..."
              className="cosmic-input pl-9 py-2 text-xs"
              style={{ borderRadius: '14px', paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="glass-card rounded-xl p-3 flex items-center gap-3"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.dot}` }} />
              <div>
                <p className="text-white/40 text-xs">{cfg.label}</p>
                <p className="text-white font-bold">{answers.filter(a => a.status === key).length}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Answer Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="text-[#7c3aed] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <Clock size={24} className="text-white/20" />
            </div>
            <p className="text-white/40 text-sm">No answers match this filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((answer, i) => {
                const cfg = STATUS_CONFIG[answer.status]
                const isProcessing = processing === answer.id
                return (
                  <motion.div
                    key={answer.id}
                    className="glass-card rounded-2xl p-5"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                            {cfg.label}
                          </span>
                          <span className="text-white/25 text-xs">by {answer.creator_name || 'Unknown'}</span>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="text-white/25 text-xs">{new Date(answer.created_at).toLocaleDateString()}</span>
                          <span className="text-white/20 text-xs">·</span>
                          <span className="text-white/30 text-xs">Doubt #{answer.doubt_id}</span>
                        </div>

                        {/* Doubt title */}
                        <p className="text-white/50 text-xs mb-1.5 italic truncate">
                          Re: {answer.doubt_title || `Doubt #${answer.doubt_id}`}
                        </p>

                        {/* Answer body */}
                        <p className="text-white/80 text-sm leading-relaxed mb-3">{answer.body}</p>

                        {/* Footer */}
                        <div className="flex items-center gap-4">
                          {answer.status === 'approved' && (
                            <span className="text-green-400/70 text-xs">✓ Public</span>
                          )}
                          {answer.status === 'pending' && (
                            <span className="text-yellow-400/50 text-xs">⏳ Awaiting review</span>
                          )}
                          {answer.status === 'rejected' && (
                            <div className="flex items-center gap-2">
                              <span className="text-red-400/50 text-xs">✗ Rejected</span>
                              {answer.rejection_reason && (
                                <span className="text-white/30 text-xs italic">— {answer.rejection_reason}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {answer.status === 'pending' ? (
                          isProcessing ? (
                            <Loader2 size={16} className="text-white/30 animate-spin mx-auto" />
                          ) : (
                            <>
                              <motion.button
                                onClick={() => handleApprove(answer.id)}
                                className="cosmic-btn-approve"
                                whileTap={{ scale: 0.92 }}
                                title="Approve — make visible to students"
                              >
                                <CheckCircle size={13} /> Approve
                              </motion.button>
                              <motion.button
                                onClick={() => setRejectingAnswer(answer)}
                                className="cosmic-btn-reject"
                                whileTap={{ scale: 0.92 }}
                                title="Reject — keep hidden"
                              >
                                <XCircle size={13} /> Reject
                              </motion.button>
                            </>
                          )
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center justify-center w-20 h-10 rounded-xl"
                              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                              {answer.status === 'approved'
                                ? <CheckCircle size={16} className="text-green-400" />
                                : <XCircle size={16} className="text-red-400" />}
                            </div>
                            {/* Reset button for non-pending */}
                            {!isProcessing && (
                              <button
                                onClick={() => handleReset(answer.id)}
                                className="text-white/25 text-xs hover:text-white/60 transition-colors"
                                title="Reset to pending"
                              >
                                ↩ reset
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
export default AnswerModeration