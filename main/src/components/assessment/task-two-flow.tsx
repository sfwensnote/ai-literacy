'use client'

import { CalendarDays, Heart, MapPin, UsersRound } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { taskMockAIService } from '../../features/ai/task-mock-ai-service'
import { applyItinerarySuggestion, changedItineraryIds, createInitialItinerary, itineraryToText, moveItineraryItem } from '../../features/assessment/task-flow'
import type { ChatMessage, ItineraryItem, TaskTwoDraft, TripSubmission } from '../../features/assessment/types'
import { AIChatDrawer } from './ai-chat-drawer'
import { AssessmentTaskShell } from './task-shell'
import { ItineraryEditor } from './itinerary-editor'
import { ItineraryView } from './itinerary-view'
import { RequirementStrip } from './requirement-strip'

const requirements = [
  { icon: CalendarDays, title: '周六出发，周日晚回' },
  { icon: UsersRound, title: '2 人，预算约 1200 元' },
  { icon: MapPin, title: '想去：西湖、灵隐寺、河坊街' },
  { icon: Heart, title: '希望轻松一点，尽量少换乘' },
]

interface InternalTaskTwoDraft extends TaskTwoDraft { editBaseline?: ItineraryItem[] }

function normalizeDraft(raw: Record<string, unknown>): InternalTaskTwoDraft {
  const validPhase = ['initial', 'editing', 'ai_assist', 'confirm'].includes(String(raw.phase))
  if (!validPhase) return { phase: 'initial', itinerary: createInitialItinerary(), changedItemIds: [] }
  return {
    phase: raw.phase as TaskTwoDraft['phase'],
    itinerary: Array.isArray(raw.itinerary) ? raw.itinerary as ItineraryItem[] : createInitialItinerary(),
    initialAction: ['accept', 'edit', 'ask_ai'].includes(String(raw.initialAction)) ? raw.initialAction as TaskTwoDraft['initialAction'] : undefined,
    pendingSuggestionIntent: typeof raw.pendingSuggestionIntent === 'string' ? raw.pendingSuggestionIntent : undefined,
    changedItemIds: Array.isArray(raw.changedItemIds) ? raw.changedItemIds as string[] : [],
    editBaseline: Array.isArray(raw.editBaseline) ? raw.editBaseline as ItineraryItem[] : undefined,
  }
}

export function TaskTwoFlow({ draft: rawDraft, messages, updateDraft, recordEvent, appendMessage, submit }: {
  draft: Record<string, unknown>
  messages: ChatMessage[]
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  appendMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  submit: (submission: TripSubmission) => void
}) {
  const draft = normalizeDraft(rawDraft)
  const viewed = useRef(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (viewed.current) return
    viewed.current = true
    recordEvent('task2_view', { initial_itinerary: draft.itinerary })
    if (rawDraft.phase === undefined) updateDraft({ ...draft })
  }, [draft, rawDraft.phase, recordEvent, updateDraft])

  useEffect(() => {
    if (draft.changedItemIds.length === 0) return
    const timeout = window.setTimeout(() => updateDraft({ changedItemIds: [] }), 1800)
    return () => window.clearTimeout(timeout)
  }, [draft.changedItemIds, updateDraft])

  const chooseInitialAction = (action: NonNullable<TaskTwoDraft['initialAction']>) => {
    const phase = action === 'accept' ? 'confirm' : action === 'edit' ? 'editing' : 'ai_assist'
    updateDraft({ initialAction: draft.initialAction ?? action, phase, editBaseline: action === 'edit' ? draft.itinerary : draft.editBaseline })
    recordEvent('task2_initial_action', { initial_action: action })
    if (action === 'accept') recordEvent('task2_direct_accept', { direct_accept: true })
    if (action === 'ask_ai') recordEvent('task2_ai_open', { current_itinerary: draft.itinerary })
  }

  const editItem = (itemId: string, patch: Partial<ItineraryItem>) => {
    const before = draft.itinerary
    const after = before.map((item) => item.id === itemId ? { ...item, ...patch } : item)
    updateDraft({ itinerary: after })
    recordEvent('task2_edit_item', { itemId, before_itinerary: before, after_itinerary: after })
  }

  const deleteItem = (itemId: string) => {
    const before = draft.itinerary
    const after = before.filter((item) => item.id !== itemId)
    updateDraft({ itinerary: after })
    recordEvent('task2_delete_item', { itemId, before_itinerary: before, after_itinerary: after })
  }

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const before = draft.itinerary
    const after = moveItineraryItem(before, itemId, direction)
    updateDraft({ itinerary: after })
    recordEvent('task2_reorder_item', { itemId, direction, before_itinerary: before, after_itinerary: after })
  }

  const addItem = (day: ItineraryItem['day']) => {
    const before = draft.itinerary
    const item: ItineraryItem = { id: `${day}-${Date.now()}`, day, period: '下午', title: '新增安排', detail: '点击文字继续修改。' }
    const after = [...before, item]
    updateDraft({ itinerary: after })
    recordEvent('task2_add_item', { item, before_itinerary: before, after_itinerary: after })
  }

  const send = async (message: string) => {
    appendMessage({ role: 'user', content: message })
    setLoading(true)
    try {
      const response = await taskMockAIService.sendMessage({ taskId: 'trip', messages, message, currentContext: { itinerary: draft.itinerary } })
      recordEvent('task2_prompt_send', { prompt: message, intent: response.intent, current_itinerary: draft.itinerary })
      appendMessage({ role: 'assistant', content: response.content, intent: response.intent })
      recordEvent('task2_ai_response', { intent: response.intent, response: response.content, suggestion: response.suggestedItinerary })
      updateDraft({ pendingSuggestionIntent: response.intent })
    } finally {
      setLoading(false)
    }
  }

  const acceptSuggestion = () => {
    if (!draft.pendingSuggestionIntent) return
    const before = draft.itinerary
    const after = applyItinerarySuggestion(before, draft.pendingSuggestionIntent)
    const changedItemIds = changedItineraryIds(before, after)
    updateDraft({ itinerary: after, changedItemIds, pendingSuggestionIntent: undefined })
    recordEvent('task2_suggestion_accept', { intent: draft.pendingSuggestionIntent })
    recordEvent('task2_ai_applied_change', { intent: draft.pendingSuggestionIntent, before_itinerary: before, after_itinerary: after })
  }

  const rejectSuggestion = () => {
    recordEvent('task2_suggestion_reject', { intent: draft.pendingSuggestionIntent })
    updateDraft({ pendingSuggestionIntent: undefined })
  }

  const confirmSubmit = () => {
    const submission: TripSubmission = {
      saturday: itineraryToText(draft.itinerary, 'saturday'),
      sunday: itineraryToText(draft.itinerary, 'sunday'),
      checklist: [],
      adjustment: draft.initialAction === 'accept' ? '' : '已根据实际需求调整当前行程',
      itinerary: draft.itinerary,
      initialAction: draft.initialAction,
    }
    recordEvent('task2_submit', { final_itinerary: draft.itinerary, final_budget: '约 1200 元', initial_action: draft.initialAction })
    submit(submission)
  }

  const responseActions = draft.pendingSuggestionIntent ? <div className="suggestion-actions"><button type="button" onClick={rejectSuggestion}>先不采用</button><button className="primary" type="button" onClick={acceptSuggestion}>应用到行程</button></div> : undefined
  const subtitle = draft.phase === 'editing' ? '直接修改当前行程，把它调整成自己愿意执行的版本。' : draft.phase === 'confirm' ? '最后确认这份当前行程。' : 'AI 已经根据需求生成了一份两日行程，看看你会怎么处理。'

  return (
    <AssessmentTaskShell current={2} title="帮朋友把杭州周末行程改得更合适" subtitle={subtitle}>
      <RequirementStrip title="朋友的需求" items={requirements} />
      <div className={`task-two-workspace ${draft.phase === 'ai_assist' ? 'with-ai' : ''}`}>
        {draft.phase === 'editing'
          ? <ItineraryEditor items={draft.itinerary} onEdit={editItem} onDelete={deleteItem} onMove={moveItem} onAdd={addItem} />
          : <ItineraryView items={draft.itinerary} changedItemIds={draft.changedItemIds} />}
        {draft.phase === 'ai_assist' && <AIChatDrawer open messages={messages} loading={loading} hint="根据当前行程自由输入你想调整的问题。" onOpen={() => undefined} onClose={() => updateDraft({ phase: 'initial', pendingSuggestionIntent: undefined })} onSend={send} responseActions={responseActions} />}
      </div>

      {draft.phase === 'initial' && !draft.initialAction && <section className="itinerary-choice"><h2>这份行程你会怎么处理？</h2><div><button className="selected" type="button" onClick={() => chooseInitialAction('accept')}>就这样，可以</button><button type="button" onClick={() => chooseInitialAction('edit')}>我想改一改</button><button type="button" onClick={() => chooseInitialAction('ask_ai')}>问问 AI</button></div></section>}

      {draft.phase === 'initial' && draft.initialAction && <div className="post-assist-actions"><button type="button" onClick={() => updateDraft({ phase: 'editing', editBaseline: draft.itinerary })}>我想改一改</button><button type="button" onClick={() => { updateDraft({ phase: 'ai_assist' }); recordEvent('task2_ai_open', { current_itinerary: draft.itinerary }) }}>问问 AI</button><button className="task-primary" type="button" onClick={() => updateDraft({ phase: 'confirm' })}>完成我的行程</button></div>}

      {draft.phase === 'editing' && <div className="editing-footer"><button type="button" onClick={() => updateDraft({ phase: 'initial', itinerary: draft.editBaseline ?? draft.itinerary, editBaseline: undefined })}>取消编辑</button><button className="task-primary" type="button" onClick={() => updateDraft({ phase: 'confirm', editBaseline: undefined })}>完成我的行程</button></div>}

      {draft.phase === 'ai_assist' && <div className="editing-footer"><button type="button" onClick={() => updateDraft({ phase: 'initial', pendingSuggestionIntent: undefined })}>返回行程</button><button className="task-primary" type="button" onClick={() => updateDraft({ phase: 'confirm', pendingSuggestionIntent: undefined })}>完成我的行程 <span>→</span></button></div>}

      {draft.phase === 'confirm' && <section className="final-confirmation"><h2>这就是你愿意实际执行的方案吗？</h2><div><button type="button" onClick={() => updateDraft({ phase: draft.initialAction === 'accept' ? 'initial' : 'editing', editBaseline: draft.itinerary })}>返回修改</button><button className="task-primary" type="button" onClick={confirmSubmit}>确认并继续 <span>→</span></button></div></section>}
    </AssessmentTaskShell>
  )
}
