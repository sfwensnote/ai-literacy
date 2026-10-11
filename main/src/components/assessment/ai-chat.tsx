'use client'

import { Bot, Send, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { ChatMessage } from '../../features/assessment/types'

interface AIChatProps {
  title: string
  initialMessage: string
  messages: ChatMessage[]
  loading: boolean
  onSend: (message: string) => Promise<void>
}

export function AIChat({ title, initialMessage, messages, loading, onSend }: AIChatProps) {
  const [value, setValue] = useState('')
  const submit = async () => {
    const message = value.trim()
    if (!message || loading) return
    setValue('')
    await onSend(message)
  }
  return (
    <section className="chat-panel">
      <h2>{title}</h2>
      <div className="chat-messages" aria-live="polite">
        <div className="chat-row assistant"><span className="avatar"><Bot size={22} /></span><p>{initialMessage}</p></div>
        {messages.map((message) => (
          <div className={`chat-row ${message.role}`} key={message.id}>
            <span className="avatar">{message.role === 'assistant' ? <Bot size={22} /> : <UserRound size={22} />}</span>
            <p>{message.content}</p>
          </div>
        ))}
        {loading && <div className="chat-row assistant thinking"><span className="avatar"><Bot size={22} /></span><p>正在思考<span>…</span></p></div>}
      </div>
      <div className="chat-composer">
        <label className="sr-only" htmlFor="chat-input">向 AI 追问</label>
        <input id="chat-input" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void submit() }} placeholder="你可以继续向 AI 追问…" />
        <button type="button" onClick={() => void submit()} disabled={!value.trim() || loading} aria-label="发送"><Send size={21} /></button>
      </div>
    </section>
  )
}
