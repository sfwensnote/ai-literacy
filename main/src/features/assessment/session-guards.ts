import type { AssessmentSession } from './types'
import { sceneOrder } from './types'
import { isQuestionnaireComplete } from './questionnaire'

export function hasQuestionnaire(session: AssessmentSession, stage: 'pre' | 'post'): boolean {
  const response = session.questionnaires?.[stage]
  return Boolean(response?.completedAt && isQuestionnaireComplete(response))
}

export function getAllowedRoute(session: AssessmentSession | null): string {
  if (!session) return '/'
  if (!hasQuestionnaire(session, 'pre')) return '/questionnaire/pre'
  const incomplete = sceneOrder.findIndex((id) => !session.scenes[id].completedAt)
  if (incomplete >= 0) return `/assessment/${incomplete + 1}`
  if (!hasQuestionnaire(session, 'post')) return '/questionnaire/post'
  if (session.completedAt && session.scores) return '/feedback'
  return '/analyzing'
}
