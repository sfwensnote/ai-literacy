'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronRight, FileText, Paperclip, Search } from 'lucide-react'
import { assessmentStore, useAssessmentStore } from '../../features/assessment/session-store'
import {
  clubTasks,
  narrativePrompts,
  previousReceipt,
  type NarrativeMessage,
} from '../../features/assessment/narrative'
import { materialLabels, materialHints } from '../../features/assessment/workspace-config'
import { sceneOrder, type SourceCitation } from '../../features/assessment/types'
import { validateCitation } from '../../features/assessment/browser-sources'

export function NarrativeThread({
  current,
  onOpenDocument,
  onInvestigate,
}: {
  current: number
  onOpenDocument?: () => void
  onInvestigate?: () => void
}) {
  const session = useAssessmentStore((state) => state.session)
  const task = clubTasks[current - 1]
  const sceneId = sceneOrder[current - 1]
  const raw = session?.scenes[sceneId].draft ?? {}
  const messages = (raw.narrativeMessages ?? []) as NarrativeMessage[]
  const log = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const latest = assessmentStore.getState().session
    if (!latest) return
    const existing = (latest.scenes[sceneId].draft.narrativeMessages ?? []) as NarrativeMessage[]
    const initial: Array<Omit<NarrativeMessage, 'createdAt'>> = [
      { id: 'assignment', speaker: task.speaker, text: task.assignment, kind: 'assignment' },
    ]
    const receipt = previousReceipt(latest, current)
    if (receipt)
      initial.unshift({
        id: 'previous-receipt',
        speaker: '社长 林澄',
        text: receipt,
        kind: 'feedback',
      })
    const additions = [...initial, ...narrativePrompts(latest, sceneId)].filter(
      (message) => !existing.some((item) => item.id === message.id),
    )
    if (additions.length)
      assessmentStore
        .getState()
        .updateDraft(sceneId, {
          narrativeMessages: [
            ...existing,
            ...additions.map((message) => ({ ...message, createdAt: new Date().toISOString() })),
          ],
        })
  }, [current, sceneId, session, task])
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages.length])
  if (!session) return null
  const patch = (changes: Record<string, unknown>) =>
    assessmentStore.getState().updateDraft(sceneId, changes)
  const send = (text: string, quick?: 'time' | 'ack') => {
    const latest = assessmentStore.getState().session!
    const draft = latest.scenes[sceneId].draft
    const existing = (draft.narrativeMessages ?? []) as NarrativeMessage[]
    if (quick && existing.some((message) => message.id === quick)) return
    const attachment = Boolean(draft.narrativeAttachment) && !quick
    const content = text.trim() || (attachment ? '请看我整理的任务材料。' : '')
    if (!content) {
      setError('先输入消息，或附上任务材料。')
      return
    }
    const now = new Date().toISOString()
    const id = quick ?? crypto.randomUUID()
    const citations =
      attachment && Array.isArray(draft.citations)
        ? (draft.citations as SourceCitation[]).filter(validateCitation)
        : []
    const response =
      quick === 'time'
        ? '没问题，按你的节奏来。进度会保存，你可以继续查证或稍后回来。'
        : quick === 'ack'
          ? '好的，谢谢！如果发现需要调整的地方，把具体原因和依据一起告诉我。'
          : '收到你的消息。请把最终判断和依据整理在任务附件中，我们再接着推进下一件事。'
    patch({
      narrativeMessages: [
        ...existing,
        { id, speaker: '我', text: content, kind: 'reply', createdAt: now, attachment, citations },
        {
          id: id + '-reply',
          speaker: '社长 林澄',
          text: response,
          kind: 'feedback',
          createdAt: now,
        },
      ],
      narrativeInput: '',
      narrativeAttachment: false,
    })
    assessmentStore
      .getState()
      .recordEvent(
        sceneId,
        quick === 'time'
          ? 'narrative_time_requested'
          : quick === 'ack'
            ? 'narrative_acknowledged'
            : 'narrative_message_sent',
        { message: content, attachment, citations },
      )
    setError('')
  }
  return (
    <section className="desktop-club-chat" aria-label="社团消息">
      <div
        className="desktop-chat-log"
        role="log"
        aria-label="角色消息流"
        aria-live="polite"
        aria-relevant="additions"
        ref={log}
      >
        {messages.map((message) => {
          const mine = message.speaker === '我'
          return (
            <article className={`desktop-message ${mine ? 'mine' : ''}`} key={message.id}>
              <span className={`desktop-avatar ${mine ? 'user' : 'club'}`} aria-hidden="true">
                {mine ? '我' : message.speaker.includes('小夏') ? '夏' : '社'}
              </span>
              <div className="desktop-message-body">
                <div className="desktop-message-meta">
                  {!mine && (
                    <strong>
                      {message.speaker === '社长 林澄' ? '社团代表 · 林澄' : message.speaker}
                    </strong>
                  )}
                  <time dateTime={message.createdAt}>
                    {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                      timeZone: 'Asia/Shanghai',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <div className="desktop-bubble">
                  <p>{message.text}</p>
                  {(message.kind === 'assignment' || message.attachment) && (
                    <button className="desktop-material-link" onClick={onOpenDocument}>
                      <FileText aria-hidden="true" />
                      <span>
                        <strong>{materialLabels[sceneId]}</strong>
                        <small>{materialHints[sceneId]}</small>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  )}
                  {message.citations?.map((citation) => (
                    <blockquote key={citation.url + citation.excerpt}>
                      <span>{citation.url}</span>
                      <p>{citation.excerpt}</p>
                    </blockquote>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="desktop-chat-tools">
        <div className="desktop-quick-replies">
          <button
            disabled={messages.some((message) => message.id === 'ack')}
            onClick={() => send('已收到，开始处理。', 'ack')}
          >
            已收到，开始处理
          </button>
          <button
            disabled={messages.some((message) => message.id === 'time')}
            onClick={() => send('我需要更多时间。', 'time')}
          >
            我需要更多时间
          </button>
          <span role="status">
            {error || (raw.narrativeAttachment ? '已附上当前任务材料和引用' : '')}
          </span>
        </div>
        <form
          className="desktop-composer"
          onSubmit={(event) => {
            event.preventDefault()
            send(String(raw.narrativeInput ?? ''))
          }}
        >
          <button
            className="desktop-icon-button"
            type="button"
            aria-label="附上当前任务材料"
            aria-pressed={Boolean(raw.narrativeAttachment)}
            onClick={() => patch({ narrativeAttachment: !raw.narrativeAttachment })}
          >
            <Paperclip />
          </button>
          <input
            aria-label="给社团的消息"
            value={String(raw.narrativeInput ?? '')}
            onChange={(event) => {
              patch({ narrativeInput: event.target.value })
              setError('')
            }}
            placeholder="输入消息，继续和社团沟通…"
          />
          <button className="desktop-secondary" type="button" onClick={onInvestigate}>
            <Search size={20} />
            去查证
          </button>
          <button
            className="desktop-primary"
            type="submit"
            disabled={!String(raw.narrativeInput ?? '').trim() && !raw.narrativeAttachment}
          >
            发送
          </button>
        </form>
      </div>
    </section>
  )
}
