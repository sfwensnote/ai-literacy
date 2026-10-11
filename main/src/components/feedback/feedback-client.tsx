'use client'

import { BarChart3, Lightbulb, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
import { dimensionOrder, type Dimension } from '../../features/assessment/types'
import { useAssessmentStore } from '../../features/assessment/session-store'
import { generateFeedback } from '../../features/scoring/feedback-generator'
import { FeedbackNav } from './feedback-nav'
import { RadarChart } from './radar-chart'

export function FeedbackClient({ page }: { page: number }) {
  const router = useRouter()
  const session = useAssessmentStore((state) => state.session)
  const hydrated = useAssessmentStore((state) => state.hydrated)
  useEffect(() => {
    if (!hydrated) return
    if (!session) router.replace('/')
    else if (!session.scores) router.replace('/analyzing')
  }, [hydrated, router, session])
  const model = useMemo(() => session?.scores ? generateFeedback(session, session.evidence, session.scores) : null, [session])
  if (!session?.scores || !model) return <main className="feedback-loading">正在读取反馈…</main>

  if (page === 0) {
    return (
      <main className="feedback-page"><FeedbackNav page={0} />
        <div className="feedback-overview">
          <section className="overview-score"><div><h1>测评反馈</h1><p>基于四个情境任务，生成你的整体画像与建议</p></div><div className="score-panel"><h2>综合表现</h2><strong>{model.total}<small>/ 100</small></strong><p><BarChart3 size={25} />{model.overallSummary}</p></div></section>
          <RadarChart scores={session.scores} />
          <section className="portrait-panel"><h2><UserRound />你的整体画像</h2><p>{model.overallSummary} 你善于从问题出发选择 AI 工具，也开始关注输出的可靠性和个人信息边界。继续强化来源核查与多角度比较，会让你更安全、高效地发挥 AI 的价值。</p></section>
        </div>
        <div className="dimension-grid">{dimensionOrder.map((dimension, index) => { const detail = model.dimensions[dimension]; return <article key={dimension}><h2>{detail.name}</h2><strong>{detail.score}<small>/100</small></strong><p>{detail.summary}</p><Link href={`/feedback/${index + 1}`}>查看详情 →</Link></article> })}<article className="overall-advice"><h2><Lightbulb />总体建议</h2>{model.overallSuggestions.map((item, index) => <p key={item}><b>{index + 1}</b>{item}</p>)}</article></div>
      </main>
    )
  }

  const dimension = dimensionOrder[page - 1] as Dimension
  const detail = model.dimensions[dimension]
  return (
    <main className="feedback-page"><FeedbackNav page={page} />
      <div className="dimension-layout">
        <aside className="dimension-summary"><h1>{detail.name}</h1><p>{detail.summary}</p><div className="big-score"><span>本维度得分</span><strong>{detail.score}<small>/100</small></strong></div><div className="scene-link"><b>对应场景</b><span>{detail.scene}</span></div></aside>
        <section className="feedback-center"><article><h2>本页反馈</h2>{detail.feedback.map((item) => <div className="evidence-row" key={item}><span>✓</span><p>{item}</p></div>)}</article><article><h2>关键能力表现</h2>{detail.capabilities.map((item) => <div className="capability" key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.value}%` }} /></i><strong>{item.value}</strong></div>)}</article></section>
        <aside className="feedback-side"><article><h2><Lightbulb />提升建议</h2>{detail.suggestions.map((item, index) => <div className="suggestion" key={item}><b>{index + 1}</b><p>{item}</p></div>)}</article><article><h2><UserRound />你在任务中的表现</h2><ul>{detail.behaviors.map((item) => <li key={item}>{item}</li>)}</ul></article></aside>
      </div>
    </main>
  )
}
