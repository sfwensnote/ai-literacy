'use client'

import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import type {
  AssessmentSession,
  ChatMessage,
  DimensionScores,
  Evidence,
  SceneId,
  SceneSession,
  SceneSubmission,
  QuestionnaireStage,
} from './types'
import { sceneOrder } from './types'
import { isQuestionnaireComplete, questionnaireItems } from './questionnaire'

const emptyScene = (): SceneSession => ({
  messages: [],
  actions: [],
  draft: {},
  durationMs: 0,
})

const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export function createAssessmentSession(): AssessmentSession {
  return {
    version: 1,
    id: makeId(),
    startedAt: new Date().toISOString(),
    currentScene: 1,
    scenes: {
      headphones: emptyScene(),
      trip: emptyScene(),
      report: emptyScene(),
      internship: emptyScene(),
    },
    evidence: [],
  }
}

interface AssessmentState {
  session: AssessmentSession | null
  hydrated: boolean
  startSession: () => void
  markHydrated: () => void
  startScene: (sceneId: SceneId) => void
  recordEvent: (sceneId: SceneId, type: string, payload?: Record<string, unknown>) => void
  appendMessage: (sceneId: SceneId, message: Omit<ChatMessage, 'id' | 'createdAt'>) => void
  updateDraft: (sceneId: SceneId, patch: Record<string, unknown>) => void
  submitScene: (sceneId: SceneId, submission: SceneSubmission) => void
  setResults: (evidence: Evidence[], scores: DimensionScores) => void
  resetSession: () => void
  setQuestionnaireAnswer: (stage: QuestionnaireStage, id: string, value: number) => void
  completeQuestionnaire: (stage: QuestionnaireStage) => void
}

const memoryValues = new Map<string, string>()
const memoryStorage: StateStorage = {
  getItem: (key) => memoryValues.get(key) ?? null,
  setItem: (key, value) => void memoryValues.set(key, value),
  removeItem: (key) => void memoryValues.delete(key),
}

const storage = createJSONStorage(() => (typeof window === 'undefined' ? memoryStorage : localStorage))

export const assessmentStore = createStore<AssessmentState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      startSession: () => set((state) => ({ session: state.session ?? createAssessmentSession() })),
      markHydrated: () => set({ hydrated: true }),
      setQuestionnaireAnswer: (stage, id, value) => set((state) => {
        if (!state.session || !questionnaireItems.some((item) => item.id === id) || !Number.isInteger(value) || value < 1 || value > 5) return state
        const previous = state.session.questionnaires?.[stage]
        if (previous?.completedAt) return state
        return { session: { ...state.session, questionnaires: { ...state.session.questionnaires, [stage]: { answers: { ...previous?.answers, [id]: value } } } } }
      }),
      completeQuestionnaire: (stage) => set((state) => {
        if (!state.session) return state
        const response = state.session.questionnaires?.[stage]
        if (!isQuestionnaireComplete(response) || response?.completedAt) return state
        if (stage === 'post' && sceneOrder.some((id) => !state.session!.scenes[id].completedAt)) return state
        return { session: { ...state.session, ...(stage === 'post' ? { scores: undefined, completedAt: undefined, evidence: [] } : {}), questionnaires: { ...state.session.questionnaires, [stage]: { ...response!, completedAt: new Date().toISOString() } } } }
      }),
      startScene: (sceneId) => set((state) => {
        const session = state.session ?? createAssessmentSession()
        const scene = session.scenes[sceneId]
        if (scene.startedAt) return { session }
        return {
          session: {
            ...session,
            scenes: {
              ...session.scenes,
              [sceneId]: { ...scene, startedAt: new Date().toISOString() },
            },
          },
        }
      }),
      recordEvent: (sceneId, type, payload = {}) => set((state) => {
        const session = state.session ?? createAssessmentSession()
        const scene = session.scenes[sceneId]
        return {
          session: {
            ...session,
            scenes: {
              ...session.scenes,
              [sceneId]: {
                ...scene,
                actions: [...scene.actions, { id: makeId(), sceneId, type, payload, createdAt: new Date().toISOString() }],
              },
            },
          },
        }
      }),
      appendMessage: (sceneId, message) => set((state) => {
        const session = state.session ?? createAssessmentSession()
        const scene = session.scenes[sceneId]
        return {
          session: {
            ...session,
            scenes: {
              ...session.scenes,
              [sceneId]: {
                ...scene,
                messages: [...scene.messages, { ...message, id: makeId(), createdAt: new Date().toISOString() }],
              },
            },
          },
        }
      }),
      updateDraft: (sceneId, patch) => set((state) => {
        const session = state.session ?? createAssessmentSession()
        const scene = session.scenes[sceneId]
        return {
          session: {
            ...session,
            scenes: {
              ...session.scenes,
              [sceneId]: { ...scene, draft: { ...scene.draft, ...patch } },
            },
          },
        }
      }),
      submitScene: (sceneId, submission) => set((state) => {
        const session = state.session ?? createAssessmentSession()
        const scene = session.scenes[sceneId]
        if (scene.completedAt) return { session }
        const now = new Date()
        const durationMs = scene.startedAt ? Math.max(0, now.getTime() - new Date(scene.startedAt).getTime()) : 0
        const sceneIndex = sceneOrder.indexOf(sceneId)
        return {
          session: {
            ...session,
            currentScene: Math.min(4, Math.max(session.currentScene, sceneIndex + 2)),
            scenes: {
              ...session.scenes,
              [sceneId]: { ...scene, finalSubmission: submission, completedAt: now.toISOString(), durationMs },
            },
          },
        }
      }),
      setResults: (evidence, scores) => set((state) => state.session ? ({
        session: { ...state.session, evidence, scores, completedAt: new Date().toISOString() },
      }) : state),
      resetSession: () => set({ session: null }),
    }),
    {
      name: 'ai-literacy-assessment-v1',
      version: 1,
      storage,
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
)

export function useAssessmentStore<T>(selector: (state: AssessmentState) => T): T {
  return useStore(assessmentStore, selector)
}
