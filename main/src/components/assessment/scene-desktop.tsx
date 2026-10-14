'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, LayoutDashboard, MessagesSquare, Sparkles } from 'lucide-react'
import { assessmentStore } from '../../features/assessment/session-store'
import { clubTasks } from '../../features/assessment/narrative'
import {
  initialWorkspaceDraft,
  isWorkspaceTab,
  materialLabels,
  workspaceTabs,
  type WorkspaceTab,
} from '../../features/assessment/workspace-config'
import {
  applyItinerarySuggestion,
  applyReportSuggestion,
  changedItineraryIds,
} from '../../features/assessment/task-flow'
import { taskMockAIService } from '../../features/ai/task-mock-ai-service'
import type {
  ChatMessage,
  ItineraryItem,
  ReportDocument,
  SceneId,
  SceneSubmission,
} from '../../features/assessment/types'
import { NarrativeThread } from './narrative-thread'
import { SimulatedBrowser } from './simulated-browser'
import { TaskDocumentPanel } from './task-document-panel'
import { WorkspaceAI } from './workspace-ai'

export function SceneDesktop({
  current,
  sceneId,
  draft: rawDraft,
  messages,
  updateDraft,
  recordEvent,
  appendMessage,
  submit,
}: {
  current: number
  sceneId: SceneId
  draft: Record<string, unknown>
  messages: ChatMessage[]
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  appendMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  submit: (submission: SceneSubmission) => void
}) {
  const router = useRouter()
  const draft: Record<string, unknown> = {
    ...initialWorkspaceDraft(sceneId),
    ...rawDraft,
    ...(rawDraft.phase === 'ai_assist' || rawDraft.phase === 'verifying'
      ? { phase: 'initial' }
      : {}),
  }
  const active = isWorkspaceTab(draft.workspaceTab) ? draft.workspaceTab : 'chat'
  const tabIcons = {
    chat: MessagesSquare,
    browser: Globe,
    ai: Sparkles,
    workspace: LayoutDashboard,
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const tabButtons = useRef<Array<HTMLButtonElement | null>>([])
  const task = clubTasks[current - 1]
  useEffect(() => {
    const latest = assessmentStore.getState().session?.scenes[sceneId]
    if (!latest) return
    if (latest.draft.phase === undefined)
      updateDraft({ ...initialWorkspaceDraft(sceneId), ...latest.draft })
    const type = 'task' + current + '_view'
    if (!latest.actions.some((event) => event.type === type)) recordEvent(type)
  }, [current, sceneId, updateDraft, recordEvent])
  const switchTab = (tab: WorkspaceTab) => {
    if (tab !== active) recordEvent('workspace_tab_switch', { from: active, tab })
    updateDraft({ workspaceTab: tab, documentOpen: undefined })
    if (tab === 'ai' && active !== 'ai') recordEvent('task' + current + '_ai_open')
  }
  const openDocument = () => {
    if (active !== 'workspace')
      recordEvent('workspace_tab_switch', { from: active, tab: 'workspace' })
    updateDraft({ workspaceTab: 'workspace', documentOpen: undefined })
    recordEvent('task_document_open', { material: materialLabels[sceneId] })
  }
  const send = async (message: string) => {
    if (loading) return false
    const sessionId = assessmentStore.getState().session?.id
    appendMessage({ role: 'user', content: message })
    setLoading(true)
    setError('')
    try {
      const response = await taskMockAIService.sendMessage({
        taskId: sceneId,
        messages,
        message,
        currentContext: {
          selectedClaims: draft.selectedClaims as string[] | undefined,
          itinerary: draft.itinerary as ItineraryItem[] | undefined,
          report: draft.report as ReportDocument | undefined,
          sharedInfo: draft.sharedInfo as string[] | undefined,
        },
      })
      const latest = assessmentStore.getState().session
      if (!latest || latest.id !== sessionId || latest.scenes[sceneId].completedAt) return false
      recordEvent('task' + current + '_prompt_send', {
        prompt: message,
        intent: response.intent,
        selectedClaims: draft.selectedClaims,
        shared_info: draft.sharedInfo,
      })
      appendMessage({ role: 'assistant', content: response.content, intent: response.intent })
      recordEvent('task' + current + '_ai_response', {
        intent: response.intent,
        response: response.content,
      })
      if (sceneId === 'trip' || sceneId === 'report')
        updateDraft({ pendingSuggestionIntent: response.intent })
      return true
    } catch {
      setError('这次没有收到回复，请保留问题后再发送一次。')
      return false
    } finally {
      setLoading(false)
    }
  }
  const apply = () => {
    const intent = String(draft.pendingSuggestionIntent ?? '')
    if (!intent) return
    if (sceneId === 'trip') {
      const before = draft.itinerary as ItineraryItem[]
      const after = applyItinerarySuggestion(before, intent)
      updateDraft({
        itinerary: after,
        changedItemIds: changedItineraryIds(before, after),
        pendingSuggestionIntent: undefined,
        initialAction: draft.initialAction ?? 'ask_ai',
      })
      recordEvent('task2_suggestion_accept', { intent })
      recordEvent('task2_ai_applied_change', {
        intent,
        before_itinerary: before,
        after_itinerary: after,
      })
    } else if (sceneId === 'report') {
      const before = draft.report as ReportDocument
      const after = applyReportSuggestion(before, intent)
      updateDraft({
        report: after,
        changedClaimIds: [
          intent === 'real_references'
            ? 'sample_reference'
            : intent === 'conclusion'
              ? 'strong_conclusion'
              : 'unsupported_view',
        ],
        pendingSuggestionIntent: undefined,
      })
      recordEvent('task3_suggestion_accept', { intent, before_report: before, after_report: after })
    }
  }
  const reject = () => {
    recordEvent('task' + current + '_suggestion_reject', { intent: draft.pendingSuggestionIntent })
    updateDraft({ pendingSuggestionIntent: undefined })
  }
  return (
    <main className="scene-desktop">
      <header className="desktop-header">
        <div className="desktop-logo" role="img" aria-label="AI 素养测评">
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="25" cy="14" r="11" fill="#6badff" />
            <circle cx="15" cy="31" r="11" fill="#247aff" />
            <circle cx="32" cy="30" r="11" fill="#77b5ff" />
          </svg>
        </div>
        <nav className="desktop-navigation" role="tablist" aria-label="任务工作台">
          {workspaceTabs.map((tab, index) => {
            const Icon = tabIcons[tab.id]
            return (
              <button
                type="button"
                role="tab"
                id={sceneId + '-' + tab.id + '-tab'}
                aria-selected={active === tab.id}
                aria-controls={active === tab.id ? sceneId + '-' + tab.id + '-panel' : undefined}
                tabIndex={active === tab.id ? 0 : -1}
                ref={(element) => {
                  tabButtons.current[index] = element
                }}
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                onKeyDown={(event) => {
                  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
                  event.preventDefault()
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? workspaceTabs.length - 1
                        : (index + (event.key === 'ArrowRight' ? 1 : workspaceTabs.length - 1)) %
                          workspaceTabs.length
                  switchTab(workspaceTabs[next].id)
                  tabButtons.current[next]?.focus()
                }}
              >
                <Icon aria-hidden="true" size={20} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
        <button className="desktop-exit" onClick={() => router.push('/')}>
          退出
        </button>
      </header>
      <section
        className="desktop-workspace"
        id={sceneId + '-' + active + '-panel'}
        role="tabpanel"
        aria-labelledby={sceneId + '-' + active + '-tab'}
      >
        {active === 'chat' ? (
          <>
            <div className="desktop-panel-title">
              <div>
                <h1>{task.title}</h1>
                <p>先阅读社团发来的需求，再决定下一步怎么做。</p>
              </div>
              <span
                className="desktop-task-progress"
                aria-label={'第 ' + current + ' 个任务，共 4 个'}
              >
                {current} / 4
              </span>
            </div>
            <NarrativeThread
              current={current}
              onOpenDocument={openDocument}
              onInvestigate={() => switchTab('browser')}
            />
          </>
        ) : active === 'workspace' ? (
          <>
            <div className="desktop-panel-title">
              <div>
                <h1>{task.title}</h1>
                <p>核查、调整并形成你愿意提交的结果。</p>
              </div>
              <span className="desktop-task-progress">{current} / 4</span>
            </div>
            <div className="desktop-document-toolbar">
              <button className="desktop-text-button" onClick={() => switchTab('chat')}>
                <ArrowLeft size={18} />
                返回社团聊天
              </button>
              <strong>{materialLabels[sceneId]}</strong>
              <button className="desktop-secondary" onClick={() => switchTab('browser')}>
                去查证
              </button>
            </div>
            <div className="desktop-document-scroll">
              <fieldset className="desktop-document-fields" disabled={loading}>
                <TaskDocumentPanel
                  sceneId={sceneId}
                  draft={draft}
                  messages={messages}
                  updateDraft={updateDraft}
                  recordEvent={recordEvent}
                  submit={submit}
                  onAskAI={() => switchTab('ai')}
                />
              </fieldset>
            </div>
          </>
        ) : active === 'browser' ? (
          <SimulatedBrowser
            sceneId={sceneId}
            draft={draft}
            updateDraft={updateDraft}
            recordEvent={recordEvent}
          />
        ) : (
          <WorkspaceAI
            sceneId={sceneId}
            draft={draft}
            messages={messages}
            updateDraft={updateDraft}
            loading={loading}
            error={error}
            onSend={send}
            onApply={apply}
            onReject={reject}
            onOpenDocument={openDocument}
          />
        )}
      </section>
    </main>
  )
}
