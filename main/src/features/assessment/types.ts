export type SceneId = 'headphones' | 'trip' | 'report' | 'internship'

export type Dimension =
  | 'information_judgement'
  | 'ai_use'
  | 'ai_evaluation'
  | 'ai_responsibility'

export type MessageRole = 'assistant' | 'user'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  intent?: string
}

export interface RawEvent {
  id: string
  sceneId: SceneId
  type: string
  payload: Record<string, unknown>
  createdAt: string
}

export interface Evidence {
  id: string
  dimension: Dimension
  status: 'positive' | 'negative' | 'unknown'
  confidence: number
  sourceTask: SceneId
  description: string
  weight: number
  key: string
}

export interface HeadphoneSubmission {
  decision: 'adopt' | 'more_info' | 'reject'
  verifyItems: string[]
  reason: string
}

export interface ItineraryItem {
  id: string
  day: 'saturday' | 'sunday'
  period: '上午' | '下午' | '晚上'
  title: string
  detail: string
}

export type TaskOnePhase = 'initial' | 'verifying' | 'final_decision'

export interface TaskOneDraft {
  phase: TaskOnePhase
  selectedClaims: string[]
  initialSelectedClaims: string[]
  trustAll: boolean
  aiOpen: boolean
  decision?: HeadphoneSubmission['decision']
  reason: string
}

export type TaskTwoPhase = 'initial' | 'editing' | 'ai_assist' | 'confirm'

export interface TaskTwoDraft {
  phase: TaskTwoPhase
  itinerary: ItineraryItem[]
  initialAction?: 'accept' | 'edit' | 'ask_ai'
  pendingSuggestionIntent?: string
  changedItemIds: string[]
}

export interface TripSubmission {
  saturday: string
  sunday: string
  checklist: string[]
  adjustment: string
  itinerary?: ItineraryItem[]
  initialAction?: TaskTwoDraft['initialAction']
}

export interface ReportSubmission {
  title: string
  body: string
  keepItems: string[]
  modifyItems: string[]
}

export interface ReportDocument {
  title: string
  body: string
}

export type TaskThreePhase = 'initial' | 'editing' | 'ai_assist' | 'confirm'

export interface TaskThreeDraft {
  phase: TaskThreePhase
  report: ReportDocument
  selectedClaims: string[]
  trustAll: boolean
  pendingSuggestionIntent?: string
  changedClaimIds: string[]
  keepItems: string[]
  modifyItems: string[]
}

export interface InternshipSubmission {
  sharedInfo: string[]
  ratings: { match: number; growth: number; pressure: number }
  priorities: string[]
  decision: 'apply' | 'learn_more' | 'skip'
  reason: string
}

export type TaskFourPhase = 'initial' | 'ai_assist' | 'decision' | 'confirm'

export interface TaskFourDraft {
  phase: TaskFourPhase
  sharedInfo: string[]
  ratings: InternshipSubmission['ratings']
  priorities: string[]
  decision?: InternshipSubmission['decision']
  reason: string
}

export type SceneSubmission =
  | HeadphoneSubmission
  | TripSubmission
  | ReportSubmission
  | InternshipSubmission

export interface SceneSession {
  startedAt?: string
  completedAt?: string
  messages: ChatMessage[]
  actions: RawEvent[]
  draft: Record<string, unknown>
  finalSubmission?: SceneSubmission
  durationMs: number
}

export type DimensionScores = Record<Dimension, number>

export interface AssessmentSession {
  version: 1
  id: string
  startedAt: string
  currentScene: number
  scenes: Record<SceneId, SceneSession>
  evidence: Evidence[]
  scores?: DimensionScores
  completedAt?: string
}

export const sceneOrder: SceneId[] = ['headphones', 'trip', 'report', 'internship']

export const dimensionOrder: Dimension[] = [
  'information_judgement',
  'ai_use',
  'ai_evaluation',
  'ai_responsibility',
]
