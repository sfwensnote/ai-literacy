'use client'

import { FileCheck2, Files, Languages, ListChecks } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { taskMockAIService } from '../../features/ai/task-mock-ai-service'
import { applyReportSuggestion, toggleClaimSelection } from '../../features/assessment/task-flow'
import type { ChatMessage, ReportDocument as ReportValue, ReportSubmission, TaskThreeDraft } from '../../features/assessment/types'
import { AIChatDrawer } from './ai-chat-drawer'
import { ReportDocument } from './report-document'
import { RequirementStrip } from './requirement-strip'
import { AssessmentTaskShell } from './task-shell'

const initialReport: ReportValue = {
  title: '在线教育对大学生学习的影响',
  body: '在线教育突破了时间和空间限制，提高了学习资源的可获得性。一些研究认为它能增强学习自主性，但线上环境也可能削弱互动，并造成部分学生学习动机下降。Johnson 等（2021）指出在线教育显著提高了大学生的整体成绩。因此高校应全面扩大在线课程。',
}

const requirements = [
  { icon: ListChecks, title: '约 800 字' },
  { icon: Files, title: '包含不同观点' },
  { icon: FileCheck2, title: '给出资料或来源' },
  { icon: Languages, title: '语言清晰正式' },
]

const claimLabels: Record<string, string> = {
  unsupported_view: '“增强学习自主性”的依据',
  sample_reference: 'Johnson 等（2021）的引用',
  strong_conclusion: '“全面扩大在线课程”的结论',
}

const keepOptions = [
  ['multi_angle', '多角度分析'],
  ['balanced', '保留积极与消极影响'],
  ['real_sources', '补充真实来源'],
]

const modifyOptions = [
  ['remove_unknown', '删除来源不明的内容'],
  ['cautious_conclusion', '把结论写得更谨慎'],
]

function normalizeDraft(raw: Record<string, unknown>): TaskThreeDraft {
  const validPhase = ['initial', 'editing', 'ai_assist', 'confirm'].includes(String(raw.phase))
  const legacyReport = typeof raw.title === 'string' && typeof raw.body === 'string'
    ? { title: raw.title, body: raw.body }
    : initialReport
  if (!validPhase) {
    return {
      phase: 'initial', report: legacyReport, selectedClaims: [], trustAll: false,
      changedClaimIds: [], keepItems: ['multi_angle', 'balanced'], modifyItems: [],
    }
  }
  const report = raw.report && typeof raw.report === 'object' ? raw.report as ReportValue : legacyReport
  return {
    phase: raw.phase as TaskThreeDraft['phase'],
    report,
    selectedClaims: Array.isArray(raw.selectedClaims) ? raw.selectedClaims as string[] : [],
    trustAll: Boolean(raw.trustAll),
    pendingSuggestionIntent: typeof raw.pendingSuggestionIntent === 'string' ? raw.pendingSuggestionIntent : undefined,
    changedClaimIds: Array.isArray(raw.changedClaimIds) ? raw.changedClaimIds as string[] : [],
    keepItems: Array.isArray(raw.keepItems) ? raw.keepItems as string[] : ['multi_angle', 'balanced'],
    modifyItems: Array.isArray(raw.modifyItems) ? raw.modifyItems as string[] : [],
  }
}

function toggleList(items: string[], key: string) {
  return items.includes(key) ? items.filter((item) => item !== key) : [...items, key]
}

export function TaskThreeFlow({ draft: rawDraft, messages, updateDraft, recordEvent, appendMessage, submit }: {
  draft: Record<string, unknown>
  messages: ChatMessage[]
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  appendMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  submit: (submission: ReportSubmission) => void
}) {
  const draft = normalizeDraft(rawDraft)
  const viewed = useRef(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    recordEvent('task3_view', { initial_report: draft.report })
    if (rawDraft.phase === undefined) updateDraft({ ...draft })
  }, [draft, rawDraft.phase, recordEvent, updateDraft])

  useEffect(() => {
    if (!draft.changedClaimIds.length) return
    const timeout = window.setTimeout(() => updateDraft({ changedClaimIds: [] }), 1800)
    return () => window.clearTimeout(timeout)
  }, [draft.changedClaimIds, updateDraft])

  const toggleClaim = (claimId: string) => {
    const selectedClaims = toggleClaimSelection(draft.selectedClaims, claimId)
    const selected = selectedClaims.includes(claimId)
    updateDraft({ selectedClaims, trustAll: false })
    recordEvent(selected ? 'task3_claim_select' : 'task3_claim_unselect', { claimId, claimText: claimLabels[claimId] })
  }

  const openAI = () => {
    updateDraft({ phase: 'ai_assist' })
    recordEvent('task3_ai_open', { selectedClaims: draft.selectedClaims, current_report: draft.report })
  }

  const send = async (message: string) => {
    appendMessage({ role: 'user', content: message })
    setLoading(true)
    try {
      const response = await taskMockAIService.sendMessage({ taskId: 'report', messages, message, currentContext: { report: draft.report } })
      recordEvent('task3_prompt_send', { prompt: message, intent: response.intent, selectedClaims: draft.selectedClaims })
      appendMessage({ role: 'assistant', content: response.content, intent: response.intent })
      recordEvent('task3_ai_response', { intent: response.intent, response: response.content, suggestion: response.suggestedReport })
      updateDraft({ pendingSuggestionIntent: response.intent })
    } finally {
      setLoading(false)
    }
  }

  const acceptSuggestion = () => {
    if (!draft.pendingSuggestionIntent) return
    const before = draft.report
    const report = applyReportSuggestion(before, draft.pendingSuggestionIntent)
    const changedClaimIds = draft.pendingSuggestionIntent === 'real_references'
      ? ['sample_reference']
      : draft.pendingSuggestionIntent === 'conclusion' ? ['strong_conclusion'] : ['unsupported_view']
    updateDraft({ report, changedClaimIds, pendingSuggestionIntent: undefined })
    recordEvent('task3_suggestion_accept', { intent: draft.pendingSuggestionIntent, before_report: before, after_report: report })
  }

  const rejectSuggestion = () => {
    recordEvent('task3_suggestion_reject', { intent: draft.pendingSuggestionIntent })
    updateDraft({ pendingSuggestionIntent: undefined })
  }

  const updateReport = (report: ReportValue) => {
    updateDraft({ report })
    recordEvent('task3_report_edit', { report })
  }

  const responseActions = draft.pendingSuggestionIntent ? (
    <div className="suggestion-actions">
      <button type="button" onClick={rejectSuggestion}>先不采用</button>
      <button className="primary" type="button" onClick={acceptSuggestion}>应用到报告</button>
    </div>
  ) : undefined

  const editing = draft.phase === 'editing' || draft.phase === 'confirm'

  return (
    <AssessmentTaskShell current={3} title="用 AI 帮我写一份报告" subtitle="检查这份 AI 初稿，整理成你愿意提交的版本。">
      <RequirementStrip title="报告要求" items={requirements} />
      <div className={`task-three-workspace ${draft.phase === 'ai_assist' ? 'with-ai' : ''}`}>
        <div className="task-three-main">
          <ReportDocument report={draft.report} editing={editing} selectedClaims={draft.selectedClaims} changedClaimIds={draft.changedClaimIds} onToggleClaim={toggleClaim} onChange={updateReport} />
          {!editing && <section className="report-verification">
            <h2>这份初稿中，哪些内容还需要进一步确认？</h2>
            <p>直接点击报告中的句子，可以多选。</p>
            {draft.selectedClaims.length ? <div className="selected-claim-chips">{draft.selectedClaims.map((id) => <span key={id}>{claimLabels[id]}<button type="button" aria-label={`取消标记 ${claimLabels[id]}`} onClick={() => toggleClaim(id)}>×</button></span>)}</div> : <div className="claim-empty">点击你认为需要核验的引用、观点或结论</div>}
            <label className="trust-all"><input type="checkbox" checked={draft.trustAll} onChange={(event) => { const trustAll = event.target.checked; updateDraft({ trustAll, selectedClaims: trustAll ? [] : draft.selectedClaims }); recordEvent('task3_trust_all', { value: trustAll }) }} />我认为这份初稿可以直接使用</label>
          </section>}
        </div>
        {draft.phase === 'ai_assist'
          ? <AIChatDrawer open messages={messages} loading={loading} hint="根据当前报告，自由输入你想核验或修改的问题。" onOpen={() => undefined} onClose={() => updateDraft({ phase: 'initial', pendingSuggestionIntent: undefined })} onSend={send} responseActions={responseActions} />
          : draft.phase === 'initial' && <AIChatDrawer open={false} messages={messages} loading={loading} hint="如果你对引用、观点或结论有疑问，可以主动提问。" onOpen={openAI} onClose={() => undefined} onSend={send} />}
      </div>

      {draft.phase === 'initial' && <div className="report-action-row"><button type="button" onClick={() => updateDraft({ phase: 'editing' })}>编辑报告</button><button className="task-primary" type="button" onClick={() => updateDraft({ phase: 'confirm' })}>进入最终稿 <span>→</span></button></div>}
      {draft.phase === 'ai_assist' && <div className="report-action-row"><button type="button" onClick={() => updateDraft({ phase: 'initial', pendingSuggestionIntent: undefined })}>返回报告</button><button className="task-primary" type="button" onClick={() => updateDraft({ phase: 'confirm', pendingSuggestionIntent: undefined })}>进入最终稿 <span>→</span></button></div>}
      {draft.phase === 'editing' && <div className="report-action-row"><button type="button" onClick={() => updateDraft({ phase: 'initial' })}>返回查看</button><button className="task-primary" type="button" disabled={!draft.report.title.trim() || draft.report.body.trim().length < 80} onClick={() => updateDraft({ phase: 'confirm' })}>保存并继续 <span>→</span></button></div>}
      {draft.phase === 'confirm' && <ReportFinalOptions draft={draft} updateDraft={updateDraft} onSubmit={() => {
        recordEvent('task3_submit', { final_report: draft.report, selected_claims: draft.selectedClaims, keep_items: draft.keepItems, modify_items: draft.modifyItems })
        submit({ title: draft.report.title, body: draft.report.body, keepItems: draft.keepItems, modifyItems: draft.modifyItems })
      }} />}
    </AssessmentTaskShell>
  )
}

function ReportFinalOptions({ draft, updateDraft, onSubmit }: { draft: TaskThreeDraft; updateDraft: (patch: Record<string, unknown>) => void; onSubmit: () => void }) {
  return (
    <section className="report-final-options">
      <div><fieldset><legend>我保留的内容</legend>{keepOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={draft.keepItems.includes(key)} onChange={() => updateDraft({ keepItems: toggleList(draft.keepItems, key) })} />{label}</label>)}</fieldset>
      <fieldset><legend>我准备修改的地方</legend>{modifyOptions.map(([key, label]) => <label key={key}><input type="checkbox" checked={draft.modifyItems.includes(key)} onChange={() => updateDraft({ modifyItems: toggleList(draft.modifyItems, key) })} />{label}</label>)}</fieldset></div>
      <div className="report-action-row"><button type="button" onClick={() => updateDraft({ phase: 'editing' })}>继续修改</button><button className="task-primary" type="button" disabled={!draft.report.title.trim() || draft.report.body.trim().length < 80} onClick={onSubmit}>提交我的报告 <span>→</span></button></div>
    </section>
  )
}
