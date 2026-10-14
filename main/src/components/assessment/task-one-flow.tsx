'use client'

import { Headphones, TrainFront, Volume2, WalletCards } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { taskMockAIService } from '../../features/ai/task-mock-ai-service'
import { toggleClaimSelection } from '../../features/assessment/task-flow'
import type { ChatMessage, HeadphoneSubmission, TaskOneDraft, SourceCitation } from '../../features/assessment/types'
import { validateCitation } from '../../features/assessment/browser-sources'
import { SimulatedBrowser } from './simulated-browser'
import { AIChatDrawer } from './ai-chat-drawer'
import { AssessmentTaskShell } from './task-shell'
import { RequirementStrip } from './requirement-strip'

const claims = [
  { id: 'performance', text: '这款耳机在 900 元左右价位中表现出色' },
  { id: 'noise_reduction', text: '采用新一代降噪技术，在多种环境下都能有效降低噪声' },
  { id: 'battery', text: '续航约 30 小时' },
  { id: 'ranking', text: '在同价位降噪耳机中排名第一' },
  { id: 'satisfaction', text: '约 95% 的用户表示满意' },
  { id: 'recommendation', text: '这是一款非常值得购买的产品' },
]

const requirements = [
  { icon: WalletCards, title: '预算约 900 元' },
  { icon: TrainFront, title: '通勤 / 运动' },
  { icon: Volume2, title: '降噪好' },
  { icon: Headphones, title: '佩戴舒适' },
]

const decisionOptions: Array<{ value: HeadphoneSubmission['decision']; title: string; detail: string }> = [
  { value: 'adopt', title: '可以买', detail: '整体来看值得购买' },
  { value: 'more_info', title: '再查一查再决定', detail: '还有一些信息需要确认' },
  { value: 'reject', title: '先别买', detail: '目前不建议购买' },
]

function initialDraft(raw: Record<string, unknown>): TaskOneDraft {
  const validPhase = raw.phase === 'initial' || raw.phase === 'verifying' || raw.phase === 'final_decision'
  if (!validPhase) return { phase: 'initial', selectedClaims: [], initialSelectedClaims: [], trustAll: false, aiOpen: false, reason: '' }
  return {
    phase: raw.phase as TaskOneDraft['phase'],
    selectedClaims: Array.isArray(raw.selectedClaims) ? raw.selectedClaims as string[] : [],
    initialSelectedClaims: Array.isArray(raw.initialSelectedClaims) ? raw.initialSelectedClaims as string[] : [],
    trustAll: Boolean(raw.trustAll),
    aiOpen: Boolean(raw.aiOpen),
    decision: ['adopt', 'more_info', 'reject'].includes(String(raw.decision)) ? raw.decision as HeadphoneSubmission['decision'] : undefined,
    reason: typeof raw.reason === 'string' ? raw.reason : '',
  }
}

export function TaskOneFlow({ draft: rawDraft, messages, updateDraft, recordEvent, appendMessage, submit }: {
  draft: Record<string, unknown>
  messages: ChatMessage[]
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  appendMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  submit: (submission: HeadphoneSubmission) => void
}) {
  const draft = initialDraft(rawDraft)
  const viewed = useRef(false)
  const [loading, setLoading] = useState(false)
  const citations = Array.isArray(rawDraft.citations) ? (rawDraft.citations as SourceCitation[]).filter(validateCitation) : []

  useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    recordEvent('task1_view')
    if (rawDraft.phase === undefined) updateDraft({ ...draft })
  }, [draft, rawDraft.phase, recordEvent, updateDraft])

  const changeClaims = (claimId: string) => {
    const next = toggleClaimSelection(draft.selectedClaims, claimId)
    const selected = next.includes(claimId)
    updateDraft({ selectedClaims: next, trustAll: false })
    recordEvent(selected ? 'task1_claim_select' : 'task1_claim_unselect', { claimId, claimText: claims.find((claim) => claim.id === claimId)?.text })
    if (draft.initialSelectedClaims.length) recordEvent('task1_judgment_change', { before: draft.initialSelectedClaims, after: next })
  }

  const openAI = () => {
    const initialSelectedClaims = draft.initialSelectedClaims.length ? draft.initialSelectedClaims : draft.selectedClaims
    updateDraft({ phase: 'verifying', aiOpen: true, initialSelectedClaims })
    recordEvent('task1_ai_open', { selectedClaims: draft.selectedClaims })
  }

  const send = async (message: string) => {
    appendMessage({ role: 'user', content: message })
    setLoading(true)
    try {
      const response = await taskMockAIService.sendMessage({ taskId: 'headphones', messages, message, currentContext: { selectedClaims: draft.selectedClaims } })
      recordEvent('task1_prompt_send', { prompt: message, intent: response.intent, selectedClaims: draft.selectedClaims })
      appendMessage({ role: 'assistant', content: response.content, intent: response.intent })
      recordEvent('task1_ai_response', { intent: response.intent, response: response.content })
    } finally {
      setLoading(false)
    }
  }

  const setDecision = (decision: HeadphoneSubmission['decision']) => {
    updateDraft({ decision })
    recordEvent('task1_final_decision', { decision })
  }

  const assistantMessages = messages.filter((message) => message.role === 'assistant')

  if (draft.phase === 'final_decision') {
    return (
      <AssessmentTaskShell current={1} title="朋友想买一款耳机，先问了 AI" subtitle="根据前面的判断和补充信息，给朋友一个最终建议。">
        <div className="task-one-research"><div className="task-one-final-top">
          <div className="task-one-final-main">
            <RequirementStrip title="社团采购需求" items={requirements.slice(1)} />
            <section className="judgment-summary">
              <h2>你的判断</h2>
              <div className="selected-claim-chips">
                {draft.trustAll && <span>整体评价可信</span>}
                {draft.selectedClaims.map((id) => <span key={id}>{claims.find((claim) => claim.id === id)?.text}</span>)}
                {!draft.trustAll && draft.selectedClaims.length === 0 && <small>没有标记需要进一步确认的内容</small>}
              </div>
            </section>
            {assistantMessages.length > 0 && <section className="ai-supplement"><h2>AI 补充信息</h2><p>{assistantMessages.at(-1)?.content}</p></section>}
          </div>
          <AIChatDrawer open={draft.aiOpen} messages={messages} loading={loading} hint="如果还想确认更多信息，可以继续向 AI 提问。" onOpen={openAI} onClose={() => updateDraft({ aiOpen: false, phase: 'final_decision' })} onSend={send} />
        </div><SimulatedBrowser draft={rawDraft} updateDraft={updateDraft} recordEvent={recordEvent} /></div>
        <FinalAdvice decision={draft.decision} reason={draft.reason} onDecision={setDecision} onReason={(reason) => updateDraft({ reason })} />
        <section className="source-message"><h2>发给社长的消息</h2><p><b>判断：</b>{decisionOptions.find((option) => option.value === draft.decision)?.title ?? '尚未选择'}</p><p>{draft.reason || '补充你的判断理由。'}</p>
          {citations.map((citation) => <div key={citation.url + citation.excerpt}><span>{citation.url}</span><blockquote>{citation.excerpt}</blockquote></div>)}
          {!citations.length && <label><input type="checkbox" checked={Boolean(rawDraft.noSources)} onChange={(event) => { updateDraft({ noSources: event.target.checked }); recordEvent('task1_no_sources', { value: event.target.checked }) }} />暂未找到可引用来源</label>}
        </section>
        <div className="task-primary-row"><button className="task-primary" type="button" disabled={!draft.decision || !draft.reason.trim() || (!citations.length && !rawDraft.noSources)} onClick={() => {
          if (!draft.decision || !draft.reason.trim() || (!citations.length && !rawDraft.noSources)) return
          recordEvent('task1_submit', { initial_selected_claims: draft.initialSelectedClaims, final_selected_claims: draft.selectedClaims, judgment_changed: JSON.stringify(draft.initialSelectedClaims) !== JSON.stringify(draft.selectedClaims), final_decision: draft.decision, final_reason: draft.reason })
          submit({ decision: draft.decision, verifyItems: draft.selectedClaims, reason: draft.reason.trim(), citations })
        }}>提交并继续 <span>→</span></button></div>
      </AssessmentTaskShell>
    )
  }

  return (
    <AssessmentTaskShell current={1} title="朋友想买一款耳机，先问了 AI" subtitle={draft.selectedClaims.length || draft.trustAll ? '你已经完成了初步判断，也可以继续向 AI 了解更多信息。' : '看看 AI 给出的建议，判断哪些内容还需要进一步确认。'}>
      <div className="task-one-research"><div className={`task-one-workspace ${draft.aiOpen ? 'drawer-expanded' : ''}`}>
        <div className="task-one-main">
          <RequirementStrip title="社团采购需求" items={requirements} />
          <section className="interactive-advice">
            <h2>AI 的建议</h2>
            <p>
              {claims.map((claim, index) => <span key={claim.id}><button type="button" className={draft.selectedClaims.includes(claim.id) ? 'selected' : ''} aria-pressed={draft.selectedClaims.includes(claim.id)} onClick={() => changeClaims(claim.id)}>{claim.text}</button>{index < claims.length - 1 ? '，' : '。'}</span>)}
            </p>
          </section>
          <section className="claim-selection">
            <h2>标记要核查的内容</h2>
            {draft.selectedClaims.length > 0 ? <div className="selected-claim-chips">{draft.selectedClaims.map((id) => <span key={id}>{claims.find((claim) => claim.id === id)?.text}<button type="button" aria-label={`取消标记 ${claims.find((claim) => claim.id === id)?.text}`} onClick={() => changeClaims(id)}>×</button></span>)}</div> : <p>在上方建议中点选，可多选。</p>}
            <label className="trust-all"><input type="checkbox" checked={draft.trustAll} onChange={(event) => { const trustAll = event.target.checked; updateDraft({ trustAll, selectedClaims: trustAll ? [] : draft.selectedClaims }); recordEvent('task1_trust_all', { value: trustAll }) }} />我认为这段建议整体都比较可信</label>
          </section>
        </div>
        <AIChatDrawer open={draft.aiOpen} messages={messages} loading={loading} hint="如果你对 AI 的建议有疑问，可以主动提问。" onOpen={openAI} onClose={() => updateDraft({ aiOpen: false, phase: 'initial' })} onSend={send} />
      </div><SimulatedBrowser draft={rawDraft} updateDraft={updateDraft} recordEvent={recordEvent} /></div>
      <FinalAdvice decision={draft.decision} onDecision={setDecision} />
      <div className="task-primary-row"><button className="task-primary" type="button" disabled={!draft.decision} onClick={() => updateDraft({ phase: 'final_decision', aiOpen: false, initialSelectedClaims: draft.initialSelectedClaims.length ? draft.initialSelectedClaims : draft.selectedClaims })}>下一步 <span>→</span></button></div>
    </AssessmentTaskShell>
  )
}

function FinalAdvice({ decision, reason, onDecision, onReason }: {
  decision?: HeadphoneSubmission['decision']
  reason?: string
  onDecision: (decision: HeadphoneSubmission['decision']) => void
  onReason?: (reason: string) => void
}) {
  return (
    <section className="final-advice">
      <h2>你的采购建议</h2>
      <div className="final-decision-options">{decisionOptions.map((option) => <label className={decision === option.value ? 'selected' : ''} key={option.value}><input type="radio" name="task1-decision" value={option.value} checked={decision === option.value} onChange={() => onDecision(option.value)} /><span><strong>{option.title}</strong></span></label>)}</div>
      {onReason && <label className="final-reason">判断理由<textarea aria-label="判断理由" maxLength={500} required value={reason ?? ''} placeholder="结合来源和证据，说明你的判断。" onChange={(event) => onReason(event.target.value)} /></label>}
    </section>
  )
}
