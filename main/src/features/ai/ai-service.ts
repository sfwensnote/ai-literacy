import type { ChatMessage, SceneId } from '../assessment/types'

export interface AIResponse {
  content: string
  intent: string
  delayMs: number
}

export interface AIService {
  sendMessage(sceneId: SceneId, history: ChatMessage[], message: string): Promise<AIResponse>
}
