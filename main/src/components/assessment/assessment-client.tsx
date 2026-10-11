'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSceneConfig } from '../../features/assessment/scene-config'
import { useAssessmentStore } from '../../features/assessment/session-store'
import type { SceneSubmission } from '../../features/assessment/types'
import { TaskOneFlow } from './task-one-flow'
import { TaskTwoFlow } from './task-two-flow'
import { TaskThreeFlow } from './task-three-flow'
import { TaskFourFlow } from './task-four-flow'

export function AssessmentClient({ step }: { step: number }) {
  const router = useRouter()
  const config = getSceneConfig(step)
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
    startScene(config.id)
  }, [config, hydrated, startScene, startSession])

  useEffect(() => {
    if (session && step > session.currentScene) router.replace(`/assessment/${session.currentScene}`)
  }, [router, session, step])

  if (!config || !hydrated) return <main className="feedback-loading">正在读取进度…</main>
  const scene = session?.scenes[config.id]

  if (!scene) return <main className="feedback-loading">正在准备任务…</main>

  const finish = (submission: SceneSubmission) => {
    recordEvent(config.id, 'submission_completed', { submission })
    submitScene(config.id, submission)
    window.setTimeout(() => router.push(step === 4 ? '/analyzing' : `/assessment/${step + 1}`), 550)
  }

  if (config.id === 'headphones') {
    return <TaskOneFlow draft={scene.draft} messages={scene.messages} updateDraft={(patch) => updateDraft(config.id, patch)} recordEvent={(type, payload) => recordEvent(config.id, type, payload)} appendMessage={(message) => appendMessage(config.id, message)} submit={finish} />
  }

  if (config.id === 'trip') {
    return <TaskTwoFlow draft={scene.draft} messages={scene.messages} updateDraft={(patch) => updateDraft(config.id, patch)} recordEvent={(type, payload) => recordEvent(config.id, type, payload)} appendMessage={(message) => appendMessage(config.id, message)} submit={finish} />
  }

  if (config.id === 'report') {
    return <TaskThreeFlow draft={scene.draft} messages={scene.messages} updateDraft={(patch) => updateDraft(config.id, patch)} recordEvent={(type, payload) => recordEvent(config.id, type, payload)} appendMessage={(message) => appendMessage(config.id, message)} submit={finish} />
  }

  if (config.id === 'internship') {
    return <TaskFourFlow draft={scene.draft} messages={scene.messages} updateDraft={(patch) => updateDraft(config.id, patch)} recordEvent={(type, payload) => recordEvent(config.id, type, payload)} appendMessage={(message) => appendMessage(config.id, message)} submit={finish} />
  }

  return <main className="feedback-loading">正在准备任务…</main>
}
