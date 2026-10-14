'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Logo } from '../ui/logo'
import { assessmentStore, useAssessmentStore } from '../../features/assessment/session-store'
import { getAllowedRoute, hasQuestionnaire } from '../../features/assessment/session-guards'
import { agreementLabels, attitudeDomains, questionnaireItems } from '../../features/assessment/questionnaire'
import { sceneOrder, type QuestionnaireStage } from '../../features/assessment/types'

export function QuestionnaireClient({ stage }: { stage: QuestionnaireStage }) {
  const router = useRouter()
  const { session, hydrated, startSession, setQuestionnaireAnswer, completeQuestionnaire } = useAssessmentStore((state) => state)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!hydrated) return
    if (!session) { startSession(); return }
    if (stage === 'post' && (!hasQuestionnaire(session, 'pre') || sceneOrder.some((id) => !session.scenes[id].completedAt))) {
      router.replace(getAllowedRoute(session)); return
    }
    if (hasQuestionnaire(session, stage)) router.replace(getAllowedRoute(session))
  }, [hydrated, router, session, stage, startSession])
  if (!hydrated || !session || hasQuestionnaire(session, stage)) return <main className="feedback-loading">正在读取进度…</main>
  if (stage === 'post' && (!hasQuestionnaire(session, 'pre') || sceneOrder.some((id) => !session.scenes[id].completedAt))) return <main className="feedback-loading">正在返回当前任务…</main>
  const answers = session.questionnaires?.[stage]?.answers ?? {}
  const answered = questionnaireItems.filter(({ id }) => answers[id] >= 1 && answers[id] <= 5).length
  return <main className="questionnaire-page">
    <header className="assessment-app-header"><Logo /><span>校园数字媒体社 · {stage === 'pre' ? '开始之前' : '一天结束之后'}</span><button onClick={() => router.push('/')}>退出</button></header>
    <section className="questionnaire-surface">
      <div className="questionnaire-heading"><div><h1>{stage === 'pre' ? '先说说你怎么看 AI' : '做完任务，再说说你的想法'}</h1><p>按当前想法选择，没有标准答案。</p></div><span aria-live="polite">{answered} / 9 题</span></div>
      <progress value={answered} max={9} aria-label="问卷完成进度" />
      <form onSubmit={(event) => {
        event.preventDefault()
        const missing = questionnaireItems.find(({ id }) => !answers[id])
        if (missing) { setError(`还有 ${9 - answered} 题未回答。`); document.getElementById(missing.id)?.focus(); return }
        completeQuestionnaire(stage)
        router.push(getAllowedRoute(assessmentStore.getState().session))
      }}>
        <div className="questionnaire-groups">{Object.entries(attitudeDomains).map(([domain, name]) => <section key={domain}>
          <h2>{name}</h2>
          {questionnaireItems.filter((item) => item.domain === domain).map((item, index) => <fieldset id={item.id} tabIndex={-1} key={item.id}>
            <legend>{index + 1}. {item.text}</legend>
            <div className="agreement-options">{agreementLabels.map((label, i) => <label className={answers[item.id] === i + 1 ? 'selected' : ''} key={label}>
              <input type="radio" name={item.id} value={i + 1} checked={answers[item.id] === i + 1} onChange={() => { setQuestionnaireAnswer(stage, item.id, i + 1); setError('') }} />
              <span>{label}</span>
            </label>)}</div>
          </fieldset>)}
        </section>)}</div>
        <div className="questionnaire-actions"><p role="status">{error || '研究用题目草案 · 回答单独呈现，不计入行为分数'}</p><button className="task-primary" type="submit">{stage === 'pre' ? '进入社团工作台' : '查看我的报告'}</button></div>
      </form>
    </section>
  </main>
}
