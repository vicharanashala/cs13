import { memo, useState } from 'react'
import { MessageSquare, HelpCircle } from 'lucide-react'
import { DoubtModeration } from './DoubtModeration'
import { AnswerModeration } from './AnswerModeration'

export const ModerationPage = memo(function ModerationPage() {
  const [tab, setTab] = useState<'doubts' | 'answers'>('doubts')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setTab('doubts')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'doubts' ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <HelpCircle size={15} />
            Doubts
          </button>
          <button
            onClick={() => setTab('answers')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'answers' ? 'bg-[#7c3aed] text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <MessageSquare size={15} />
            Answers
          </button>
        </div>
      </div>

      {tab === 'doubts' ? <DoubtModeration /> : <AnswerModeration />}
    </div>
  )
})
export default ModerationPage