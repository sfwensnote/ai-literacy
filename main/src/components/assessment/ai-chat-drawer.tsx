'use client'

import { MessageCircleMore, Plus, Send, Sparkles, UserRound, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import type { ChatMessage } from '../../features/assessment/types'

export function AIChatDrawer({ open, messages, loading, hint, onOpen, onClose, onSend, responseActions }: {
  open: boolean
  messages: ChatMessage[]
  loading: boolean
  hint: string
  onOpen: () => void
  onClose: () => void
  onSend: (message: string) => Promise<void>
  responseActions?: ReactNode
}) {
  const [value, setValue] = useState('')
  const submit = async () => {
    const message = value.trim()
    if (!message || loading) return
    setValue('')
    await onSend(message)
  }

  if (!open) {
    return (
      <aside className="ai-drawer ai-drawer-closed">
        <div className="ai-drawer-title"><h2><MessageCircleMore />问问 AI</h2><button type="button" aria-label="问问 AI" onClick={onOpen}><Plus /></button></div>
        <p>{hint}</p>
      </aside>
    )
  }

  return (
    <aside className="ai-drawer ai-drawer-open">
      <div className="ai-drawer-title"><h2><MessageCircleMore />问问 AI</h2><button type="button" aria-label="关闭 AI" onClick={onClose}><X /></button></div>
      <p className="ai-drawer-hint">{hint}</p>
      <div className="ai-drawer-messages" aria-live="polite">
        {messages.length === 0 && <div className="ai-empty"><Sparkles /><p>直接输入你想了解的问题。</p></div>}
        {messages.map((message) => (
          <div className={`drawer-message ${message.role}`} key={message.id}>
            <span>{message.role === 'user' ? <UserRound /> : <Sparkles />}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {loading && <div className="drawer-message assistant"><span><Sparkles /></span><p>正在整理补充信息…</p></div>}
        {responseActions}
      </div>
      <div className="ai-drawer-composer">
        <label className="sr-only" htmlFor="focused-ai-input">向 AI 追问</label>
        <input id="focused-ai-input" aria-label="向 AI 追问" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submit() }} placeholder="继续向 AI 提问" />
        <button type="button" aria-label="发送" disabled={!value.trim() || loading} onClick={() => void submit()}><Send /></button>
      </div>
    </aside>
  )
}
