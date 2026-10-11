import type { AssessmentSession } from './types'

export function getAllowedRoute(session: AssessmentSession | null): string {
  if (!session) return '/'
  if (session.completedAt && session.scores) return '/feedback'
  return `/assessment/${session.currentScene}`
}
