'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clubTasks } from '../../features/assessment/narrative'
import { getAllowedRoute, hasQuestionnaire } from '../../features/assessment/session-guards'
import { useAssessmentStore } from '../../features/assessment/session-store'
import type { SceneSubmission } from '../../features/assessment/types'
import { SceneDesktop } from './scene-desktop'
import { findBrowserSource, validateCitation } from '../../features/assessment/browser-sources'
import type { SourceCitation } from '../../features/assessment/types'

export function AssessmentClient({ step }: { step: number }) {
  const router = useRouter()
  const config = clubTasks[step - 1]
  const session = useAssessmentStore((state) => state.session)
  const hydrated = useAssessmentStore((state) => state.hydrated)
  const startSession = useAssessmentStore((state) => state.startSession)
  const startScene = useAssessmentStore((state) => state.startScene)
  const appendMessage = useAssessmentStore((state) => state.appendMessage)
  const recordEvent = useAssessmentStore((state) => state.recordEvent)
  const submitScene = useAssessmentStore((state) => state.submitScene)
  const updateDraft = useAssessmentStore((state) => state.updateDraft)

  useEffect(() => {
    if (!hydrated || !config) return
    startSession()
    if (!session || !hasQuestionnaire(session, 'pre')) return
    const allowed = getAllowedRoute(session)
    if (allowed !== `/assessment/${step}`) {
      router.replace(allowed)
      return
    }
    startScene(config.id)
  }, [config, hydrated, router, session, step, startScene, startSession])

  useEffect(() => {
    if (session && !hasQuestionnaire(session, 'pre')) router.replace('/questionnaire/pre')
  }, [router, session, step])

  if (!config || !hydrated) return <main className="feedback-loading">正在读取进度…</main>
  if (
    !session ||
    !hasQuestionnaire(session, 'pre') ||
    getAllowedRoute(session) !== `/assessment/${step}`
  )
    return <main className="feedback-loading">正在读取进度…</main>
  const scene = session?.scenes[config.id]

  if (!scene) return <main className="feedback-loading">正在准备任务…</main>

  const finish = (submission: SceneSubmission) => {
    const citations = Array.isArray(scene.draft.citations)
      ? (scene.draft.citations as SourceCitation[]).filter(
          (citation) =>
            validateCitation(citation) &&
            (findBrowserSource(citation.sourceId)?.sceneId ?? 'headphones') === config.id,
        )
      : []
    const result = { ...submission, citations }
    recordEvent(config.id, 'submission_completed', { submission: result })
    submitScene(config.id, result)
    router.push(step === 4 ? '/questionnaire/post' : `/assessment/${step + 1}`)
  }

  return (
    <SceneDesktop
      key={config.id}
      current={step}
      sceneId={config.id}
      draft={scene.draft}
      messages={scene.messages}
      updateDraft={(patch) => updateDraft(config.id, patch)}
      recordEvent={(type, payload) => recordEvent(config.id, type, payload)}
      appendMessage={(message) => appendMessage(config.id, message)}
      submit={finish}
    />
  )
}
