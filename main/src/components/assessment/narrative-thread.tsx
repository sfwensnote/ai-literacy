'use client'

import { useEffect, useRef } from 'react'
import { Check, Clock3 } from 'lucide-react'
import { assessmentStore, useAssessmentStore } from '../../features/assessment/session-store'
import { clubTasks, narrativePrompts, previousReceipt, type NarrativeMessage } from '../../features/assessment/narrative'
import { sceneOrder } from '../../features/assessment/types'

export function NarrativeThread({ current }: { current: number }) {
  const session = useAssessmentStore((state) => state.session)
  const task = clubTasks[current - 1]
  const sceneId = sceneOrder[current - 1]
  const messages = (session?.scenes[sceneId].draft.narrativeMessages ?? []) as NarrativeMessage[]
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const latest = assessmentStore.getState().session
    if (!latest) return
    const existing = (latest.scenes[sceneId].draft.narrativeMessages ?? []) as NarrativeMessage[]
    const initial: Array<Omit<NarrativeMessage, 'createdAt'>> = [{ id: 'assignment', speaker: task.speaker, text: task.assignment, kind: 'assignment' }]
    const receipt = previousReceipt(latest, current)
    if (receipt) initial.unshift({ id: 'previous-receipt', speaker: '社长 林澄', text: receipt, kind: 'feedback' })
    const additions = [...initial, ...narrativePrompts(latest, sceneId)].filter((message) => !existing.some((item) => item.id === message.id))
    if (additions.length) assessmentStore.getState().updateDraft(sceneId, { narrativeMessages: [...existing, ...additions.map((message) => ({ ...message, createdAt: new Date().toISOString() }))] })
  }, [current, sceneId, session, task])
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' }) }, [messages.length])
  if (!session) return null
  const completed = sceneOrder.filter((id) => session.scenes[id].completedAt).length
  const reply = (time: boolean) => {
    const latest = assessmentStore.getState().session!
    const existing = (latest.scenes[sceneId].draft.narrativeMessages ?? []) as NarrativeMessage[]
    const kind = time ? 'time' : 'ack'
    if (existing.some((message) => message.id === kind)) return
    const now = new Date().toISOString()
    assessmentStore.getState().updateDraft(sceneId, { narrativeMessages: [...existing,
      { id: kind, speaker: '我', text: time ? '我需要更多时间。' : '已收到，开始处理。', kind: 'reply', createdAt: now },
      { id: kind + '-reply', speaker: '社长 林澄', text: time ? '没问题，按你的节奏来。进度会保存，你可以继续查证或稍后回来。' : '好，最终结果发在工作台里，我等你。', kind: 'feedback', createdAt: now },
    ] })
    assessmentStore.getState().recordEvent(sceneId, time ? 'narrative_time_requested' : 'narrative_acknowledged')
  }
  return <aside className="club-narrative" aria-label="社团消息">
    <div className="club-channel"><h2>社团工作群</h2><span>{task.time}</span></div>
    <div className="club-day-progress"><span>今天的四件事</span><b>{completed} / 4 完成</b><progress value={completed} max={4} aria-label="社团任务完成进度" />
      <ol>{clubTasks.map((item, index) => <li className={current === index + 1 ? 'active' : ''} key={item.id} aria-current={current === index + 1 ? 'step' : undefined}><span>{session.scenes[item.id].completedAt ? <Check size={14} /> : index + 1}</span>{item.short}</li>)}</ol>
    </div>
    <div className="club-message-log" role="log" aria-label="角色消息流" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => <article className={message.speaker === '我' ? 'mine' : ''} key={message.id}><strong>{message.speaker}</strong><p>{message.text}</p></article>)}<div ref={end} />
    </div>
    <div className="club-replies"><button disabled={messages.some((message) => message.id === 'ack')} onClick={() => reply(false)}>已收到，开始处理</button><button disabled={messages.some((message) => message.id === 'time')} onClick={() => reply(true)}><Clock3 size={15} />我需要更多时间</button></div>
  </aside>
}
