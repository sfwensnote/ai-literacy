'use client'

import { BookOpenCheck, BrainCircuit, BriefcaseBusiness, Clock3 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { taskMockAIService } from '../../features/ai/task-mock-ai-service'
import { toggleLimitedSelection } from '../../features/assessment/task-flow'
import type { ChatMessage, InternshipSubmission, TaskFourDraft } from '../../features/assessment/types'
import { AIChatDrawer } from './ai-chat-drawer'
import { InternshipAnalysis } from './internship-analysis'
import { RequirementStrip } from './requirement-strip'
import { AssessmentTaskShell } from './task-shell'

const jobFacts = [
  { icon: BriefcaseBusiness, title: '算法实习生', detail: '教育科技与大模型项目' },
  { icon: Clock3, title: '3 个月 · 可远程' },
  { icon: BrainCircuit, title: 'Python / 机器学习基础' },
  { icon: BookOpenCheck, title: '云启科技', detail: '岗位描述仍有待确认' },
]

const personalFacts = ['当前研一', '正在学习机器学习', '希望积累大模型项目经验', '本学期课程较多、时间有限']

const shareOptions = [
  ['major', '专业和研究方向'], ['skills', '已掌握技能'], ['time', '可投入时间'],
  ['real_name', '真实姓名'], ['phone', '手机号'], ['student_id', '学号'], ['id_card', '身份证号'],
]

const priorityOptions = ['方向匹配', '时间可控', '成长空间', '团队支持']

const decisionOptions: Array<{ value: InternshipSubmission['decision']; title: string; detail: string }> = [
  { value: 'apply', title: '准备投递', detail: '信息已足够，可以尝试' },
  { value: 'learn_more', title: '再了解一下', detail: '先确认项目与时间要求' },
  { value: 'skip', title: '暂不投递', detail: '目前不符合个人安排' },
]

function normalizeDraft(raw: Record<string, unknown>): TaskFourDraft {
  const validPhase = ['initial', 'ai_assist', 'decision', 'confirm'].includes(String(raw.phase))
  const ratings = raw.ratings && typeof raw.ratings === 'object'
    ? raw.ratings as InternshipSubmission['ratings']
    : { match: 4, growth: 4, pressure: 3 }
  const decision = ['apply', 'learn_more', 'skip'].includes(String(raw.decision))
    ? raw.decision as InternshipSubmission['decision']
    : undefined
  return {
    phase: validPhase ? raw.phase as TaskFourDraft['phase'] : 'initial',
    sharedInfo: Array.isArray(raw.sharedInfo) ? raw.sharedInfo as string[] : ['major', 'skills', 'time'],
    ratings,
    priorities: Array.isArray(raw.priorities) ? (raw.priorities as string[]).slice(-2) : [],
    decision,
    reason: typeof raw.reason === 'string' ? raw.reason : '',
  }
}

export function TaskFourFlow({ draft: rawDraft, messages, updateDraft, recordEvent, appendMessage, submit }: {
  draft: Record<string, unknown>
  messages: ChatMessage[]
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  appendMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  submit: (submission: InternshipSubmission) => void
}) {
  const draft = normalizeDraft(rawDraft)
  const viewed = useRef(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    recordEvent('task4_view', { initial_shared_info: draft.sharedInfo })
    if (rawDraft.phase === undefined) updateDraft({ ...draft })
  }, [draft, rawDraft.phase, recordEvent, updateDraft])

  const toggleSharedInfo = (key: string) => {
    const sharedInfo = draft.sharedInfo.includes(key)
      ? draft.sharedInfo.filter((item) => item !== key)
      : [...draft.sharedInfo, key]
    updateDraft({ sharedInfo })
    recordEvent('task4_shared_info_change', { key, selected: sharedInfo.includes(key), shared_info: sharedInfo })
  }

  const openAI = () => {
    updateDraft({ phase: 'ai_assist' })
    recordEvent('task4_ai_open', { shared_info: draft.sharedInfo })
  }

  const send = async (message: string) => {
    appendMessage({ role: 'user', content: message })
    setLoading(true)
    try {
      const response = await taskMockAIService.sendMessage({ taskId: 'internship', messages, message, currentContext: { sharedInfo: draft.sharedInfo } })
      recordEvent('task4_prompt_send', { prompt: message, intent: response.intent, shared_info: draft.sharedInfo })
      appendMessage({ role: 'assistant', content: response.content, intent: response.intent })
      recordEvent('task4_ai_response', { intent: response.intent, response: response.content })
    } finally {
      setLoading(false)
    }
  }

  const setRating = (key: keyof InternshipSubmission['ratings'], value: number) => {
    const ratings = { ...draft.ratings, [key]: value }
    updateDraft({ ratings })
    recordEvent('task4_rating_change', { key, value, ratings })
  }

  const togglePriority = (priority: string) => {
    const priorities = toggleLimitedSelection(draft.priorities, priority, 2)
    updateDraft({ priorities })
    recordEvent('task4_priority_change', { priority, priorities })
  }

  const setDecision = (decision: InternshipSubmission['decision']) => {
    updateDraft({ decision })
    recordEvent('task4_decision_change', { decision })
  }

  const submitDecision = () => {
    if (!draft.decision) return
    const submission: InternshipSubmission = {
      sharedInfo: draft.sharedInfo,
      ratings: draft.ratings,
      priorities: draft.priorities,
      decision: draft.decision,
      reason: draft.reason,
    }
    recordEvent('task4_submit', { submission })
    submit(submission)
  }

  if (draft.phase === 'decision') {
    return (
      <AssessmentTaskShell current={4} title="我该投这份实习吗？" subtitle="结合岗位信息和自己的情况，形成最终判断。">
        <InternshipAnalysis compact />
        <DecisionPanel draft={draft} updateDraft={updateDraft} setRating={setRating} togglePriority={togglePriority} setDecision={setDecision} />
        <div className="report-action-row"><button type="button" onClick={() => updateDraft({ phase: 'initial' })}>返回分析</button><button className="task-primary" type="button" disabled={!draft.decision} onClick={() => updateDraft({ phase: 'confirm' })}>确认我的选择 <span>→</span></button></div>
      </AssessmentTaskShell>
    )
  }

  if (draft.phase === 'confirm') {
    const decisionLabel = decisionOptions.find((option) => option.value === draft.decision)?.title
    return (
      <AssessmentTaskShell current={4} title="我该投这份实习吗？" subtitle="最后确认这份决定仍然来自你的判断。">
        <section className="internship-confirmation">
          <h2>我的最终决定</h2>
          <strong>{decisionLabel}</strong>
          <p>{draft.reason.trim() || '暂未补充理由'}</p>
          <div><span>岗位匹配 {draft.ratings.match}/5</span><span>成长收获 {draft.ratings.growth}/5</span><span>时间压力 {draft.ratings.pressure}/5</span></div>
          <div>{draft.priorities.map((priority) => <span key={priority}>{priority}</span>)}</div>
        </section>
        <div className="report-action-row"><button type="button" onClick={() => updateDraft({ phase: 'decision' })}>返回修改</button><button className="task-primary" type="button" onClick={submitDecision}>提交我的判断 <span>→</span></button></div>
      </AssessmentTaskShell>
    )
  }

  return (
    <AssessmentTaskShell current={4} title="我该投这份实习吗？" subtitle="先看清岗位和自己的情况，再决定是否投递。">
      <RequirementStrip title="社长转来的岗位" items={jobFacts} />
      <section className="personal-context"><h2>我的情况</h2><div>{personalFacts.map((fact) => <span key={fact}>{fact}</span>)}</div></section>
      <section className="shared-info-panel"><h2>提供给 AI 的信息</h2><p>选择你愿意用于这次分析的信息。</p><div>{shareOptions.map(([key, label]) => <label key={key} className={draft.sharedInfo.includes(key) ? 'selected' : ''}><input type="checkbox" checked={draft.sharedInfo.includes(key)} onChange={() => toggleSharedInfo(key)} />{label}</label>)}</div></section>
      <div className={`task-four-workspace ${draft.phase === 'ai_assist' ? 'with-ai' : ''}`}>
        <InternshipAnalysis />
        {draft.phase === 'ai_assist'
          ? <AIChatDrawer open messages={messages} loading={loading} hint="结合岗位和你的实际情况，自由输入想了解的问题。" onOpen={() => undefined} onClose={() => updateDraft({ phase: 'initial' })} onSend={send} />
          : <AIChatDrawer open={false} messages={messages} loading={loading} hint="如果还有不确定的风险或条件，可以主动提问。" onOpen={openAI} onClose={() => undefined} onSend={send} />}
      </div>
      <div className="report-action-row"><button className="task-primary" type="button" onClick={() => updateDraft({ phase: 'decision' })}>形成我的判断 <span>→</span></button></div>
    </AssessmentTaskShell>
  )
}

function DecisionPanel({ draft, updateDraft, setRating, togglePriority, setDecision }: {
  draft: TaskFourDraft
  updateDraft: (patch: Record<string, unknown>) => void
  setRating: (key: keyof InternshipSubmission['ratings'], value: number) => void
  togglePriority: (priority: string) => void
  setDecision: (decision: InternshipSubmission['decision']) => void
}) {
  return (
    <section className="internship-decision-panel">
      <h2>我的判断</h2>
      <div className="internship-ratings"><DotRating label="岗位匹配" value={draft.ratings.match} onChange={(value) => setRating('match', value)} /><DotRating label="成长收获" value={draft.ratings.growth} onChange={(value) => setRating('growth', value)} /><DotRating label="时间压力" value={draft.ratings.pressure} onChange={(value) => setRating('pressure', value)} /></div>
      <div className="internship-priorities"><strong>我最看重的两点</strong><div>{priorityOptions.map((priority) => <button type="button" key={priority} className={draft.priorities.includes(priority) ? 'selected' : ''} onClick={() => togglePriority(priority)}>{priority}</button>)}</div></div>
      <fieldset className="internship-decisions"><legend>最终选择</legend><div>{decisionOptions.map((option) => <label className={draft.decision === option.value ? 'selected' : ''} key={option.value}><input type="radio" name="task4-decision" checked={draft.decision === option.value} onChange={() => setDecision(option.value)} /><span><strong>{option.title}</strong><small>{option.detail}</small></span></label>)}</div></fieldset>
      <label className="internship-reason">我的理由（可选）<input aria-label="我的理由" value={draft.reason} placeholder="例如：方向匹配，但需要先确认每周投入时间。" onChange={(event) => updateDraft({ reason: event.target.value })} /></label>
    </section>
  )
}

function DotRating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <fieldset><legend>{label}</legend><div>{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" aria-label={`${label} ${score} 分`} className={score <= value ? 'filled' : ''} onClick={() => onChange(score)} />)}</div></fieldset>
}
