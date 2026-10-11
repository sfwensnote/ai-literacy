import type { ChatMessage, ItineraryItem, ReportDocument, SceneId } from '../assessment/types'
import { applyItinerarySuggestion, applyReportSuggestion } from '../assessment/task-flow'
import { createMockAIService } from './mock-ai-service'

export interface TaskAIRequest {
  taskId: SceneId
  messages: ChatMessage[]
  message: string
  currentContext: {
    selectedClaims?: string[]
    itinerary?: ItineraryItem[]
    report?: ReportDocument
    sharedInfo?: string[]
  }
}

export interface TaskAIResponse {
  content: string
  intent: string
  delayMs: number
  suggestedItinerary?: ItineraryItem[]
  suggestedReport?: ReportDocument
}

export function createTaskMockAIService(options: { delay?: boolean } = {}) {
  const service = createMockAIService(options)
  return {
    async sendMessage(request: TaskAIRequest): Promise<TaskAIResponse> {
      const response = await service.sendMessage(request.taskId, request.messages, request.message)
      return {
        ...response,
        suggestedItinerary: request.taskId === 'trip' && request.currentContext.itinerary
          ? applyItinerarySuggestion(request.currentContext.itinerary, response.intent)
          : undefined,
        suggestedReport: request.taskId === 'report' && request.currentContext.report
          ? applyReportSuggestion(request.currentContext.report, response.intent)
          : undefined,
      }
    },
  }
}

export const taskMockAIService = createTaskMockAIService()
