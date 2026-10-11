'use client'

import { ArrowRight, RotateCcw } from 'lucide-react'
import { getAllowedRoute } from '../../features/assessment/session-guards'
import { useAssessmentStore } from '../../features/assessment/session-store'

export function HomeActions() {
  const session = useAssessmentStore((state) => state.session)
  const hydrated = useAssessmentStore((state) => state.hydrated)
  const startSession = useAssessmentStore((state) => state.startSession)
  const resetSession = useAssessmentStore((state) => state.resetSession)
  const href = session ? getAllowedRoute(session) : '/assessment/1'

  return (
    <div className="home-actions">
      <a className="primary-cta" href={href} onClick={() => { if (!session) startSession() }}>
        {hydrated && session ? '继续测评' : '开始测评'} <ArrowRight size={30} />
      </a>
      {hydrated && session && (
        <button
          className="reset-link"
          type="button"
          onClick={() => { if (window.confirm('确定清空当前进度并重新开始吗？')) resetSession() }}
        >
          <RotateCcw size={17} />重新开始
        </button>
      )}
    </div>
  )
}
