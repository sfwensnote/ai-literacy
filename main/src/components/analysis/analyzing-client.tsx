'use client'

import { Check, LoaderCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAssessmentStore } from '../../features/assessment/session-store'
import { extractEvidence } from '../../features/scoring/evidence-extractor'
import { calculateScores } from '../../features/scoring/scoring-service'
import { Logo } from '../ui/logo'

const steps = ['整理任务记录', '分析交互过程', '提取关键表现', '生成个人反馈']

export function AnalyzingClient() {
  const router = useRouter()
  const session = useAssessmentStore((state) => state.session)
  const hydrated = useAssessmentStore((state) => state.hydrated)
  const setResults = useAssessmentStore((state) => state.setResults)
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (!hydrated) return
    if (!session) { router.replace('/'); return }
    if (!session.scenes.internship.completedAt) { router.replace(`/assessment/${session.currentScene}`); return }
    const timers = steps.map((_, index) => window.setTimeout(() => setVisible(index + 1), index * 350 + 180))
    const finish = window.setTimeout(() => {
      const evidence = extractEvidence(session)
      setResults(evidence, calculateScores(evidence))
      router.replace('/feedback')
    }, 1750)
    return () => { timers.forEach(window.clearTimeout); window.clearTimeout(finish) }
  }, [hydrated, router, session, setResults])

  return (
    <main className="analyzing-page">
      <Logo />
      <section className="analysis-box">
        <div className="analysis-orbit"><LoaderCircle size={38} /></div>
        <h1>{visible === steps.length ? '分析完成' : '正在生成你的个人反馈'}</h1>
        <p>我们正在根据四个任务中的真实操作整理结果</p>
        <div className="analysis-steps">{steps.map((step, index) => <div key={step} className={index < visible ? 'done' : ''}><span>{index < visible ? <Check size={17} /> : index + 1}</span>{step}</div>)}</div>
      </section>
    </main>
  )
}
