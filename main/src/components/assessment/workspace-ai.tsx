'use client'

import { useEffect, useRef } from 'react'
import { FileText, Paperclip } from 'lucide-react'
import type { ChatMessage, SceneId } from '../../features/assessment/types'
import { taskContext } from '../../features/assessment/workspace-config'

export function WorkspaceAI({
  sceneId,
  draft,
  messages,
  loading,
  error,
  updateDraft,
  onSend,
  onApply,
  onReject,
  onOpenDocument,
}: {
  sceneId: SceneId
  draft: Record<string, unknown>
  messages: ChatMessage[]
  loading: boolean
  error: string
  updateDraft: (patch: Record<string, unknown>) => void
  onSend: (message: string) => Promise<boolean>
  onApply: () => void
  onReject: () => void
  onOpenDocument: () => void
}) {
  const log = useRef<HTMLDivElement>(null)
  const value = String(draft.aiInput ?? '')
  const pending =
    Boolean(draft.pendingSuggestionIntent) && (sceneId === 'trip' || sceneId === 'report')
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages.length, loading])
  return (
    <section className="desktop-ai">
      <div className="desktop-panel-title">
        <div>
          <h1>问问 AI</h1>
          <p>围绕任务中的内容继续追问，获取更多判断依据。</p>
        </div>
        <button className="desktop-text-button" onClick={onOpenDocument}>
          查看任务附件
        </button>
      </div>
      <div className="desktop-context">
        <FileText aria-hidden="true" />
        <p>
          <strong>
            {sceneId === 'headphones' || sceneId === 'report' ? '已标记待确认：' : '当前任务背景：'}
          </strong>
          {taskContext(sceneId, draft)}
        </p>
      </div>
      <div
        className="desktop-chat-log"
        role="log"
        aria-label="AI 对话"
        aria-live="polite"
        aria-relevant="additions"
        ref={log}
      >
        {messages.length === 0 && (
          <div className="desktop-ai-intro">
            <span className="desktop-avatar assistant">AI</span>
            <div className="desktop-bubble">
              <p>我可以帮你梳理材料、比较方案或解释不确定的说法。你想先确认哪一点？</p>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <article
            className={`desktop-message ${message.role === 'user' ? 'mine' : ''}`}
            key={message.id}
          >
            <span
              className={`desktop-avatar ${message.role === 'user' ? 'user' : 'assistant'}`}
              aria-hidden="true"
            >
              {message.role === 'user' ? '我' : 'AI'}
            </span>
            <div className="desktop-message-body">
              <div className="desktop-bubble">
                <p>{message.content}</p>
                {index === messages.length - 1 && message.role === 'assistant' && pending && (
                  <div className="desktop-suggestion-actions">
                    <button className="desktop-secondary" onClick={onReject}>
                      先不采用
                    </button>
                    <button className="desktop-primary" onClick={onApply}>
                      {sceneId === 'trip' ? '应用到行程' : '应用到报告'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
        {loading && (
          <article className="desktop-message">
            <span className="desktop-avatar assistant">AI</span>
            <div className="desktop-bubble">
              <p>正在整理补充信息…</p>
            </div>
          </article>
        )}
      </div>
      <div className="desktop-ai-tools">
        <p className="desktop-error" role="status">
          {error || (draft.aiAttachContext ? '已附上当前任务背景' : '')}
        </p>
        <form
          className="desktop-composer"
          onSubmit={async (event) => {
            event.preventDefault()
            const message = value.trim()
            if (!message || loading) return
            const success = await onSend(message)
            if (success) updateDraft({ aiInput: '' })
          }}
        >
          <button
            type="button"
            className="desktop-icon-button"
            aria-label="附上当前任务背景"
            aria-pressed={Boolean(draft.aiAttachContext)}
            onClick={() => updateDraft({ aiAttachContext: !draft.aiAttachContext })}
          >
            <Paperclip />
          </button>
          <input
            aria-label="向 AI 追问"
            value={value}
            onChange={(event) => updateDraft({ aiInput: event.target.value })}
            placeholder="继续追问…"
            disabled={loading}
          />
          <button className="desktop-primary" type="submit" disabled={!value.trim() || loading}>
            发送
          </button>
        </form>
      </div>
    </section>
  )
}
