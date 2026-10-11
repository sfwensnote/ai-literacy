import type { ChatMessage, SceneId } from '../assessment/types'
import type { AIResponse, AIService } from './ai-service'
import { responseText } from './mock-responses'

interface MockAIOptions { delay?: boolean }

const includesAny = (text: string, words: string[]) => words.some((word) => text.includes(word))

function detectIntent(sceneId: SceneId, raw: string): string {
  const text = raw.toLowerCase().replace(/\s+/g, '')
  if (sceneId === 'headphones') {
    if (includesAny(text, ['95%', '95％', '满意度'])) return 'satisfaction_source'
    if (includesAny(text, ['排名第一', 'rankedfirst', '第一名'])) return 'ranking_source'
    if (includesAny(text, ['佩戴', '舒服', '舒适'])) return 'comfort'
    if (includesAny(text, ['其他产品', '对比', '替代'])) return 'alternatives'
    if (includesAny(text, ['值得买', '能买吗', '预算'])) return 'value'
  }
  if (sceneId === 'trip') {
    if (includesAny(text, ['太赶', '节奏', '换乘', '路线', '顺一点'])) return 'pace_transport'
    if (includesAny(text, ['预算', '费用', '多少钱'])) return 'budget'
    if (includesAny(text, ['美食', '吃', '餐厅'])) return 'food'
    if (includesAny(text, ['时间', '几点', '多久'])) return 'time'
  }
  if (sceneId === 'report') {
    if (includesAny(text, ['真实', '参考文献', '引用', '来源', 'reference'])) return 'real_references'
    if (includesAny(text, ['结论', '谨慎', '绝对'])) return 'conclusion'
    if (includesAny(text, ['不同观点', '多角度', '正反'])) return 'perspectives'
  }
  if (sceneId === 'internship') {
    if (includesAny(text, ['最大风险', '风险', '隐患'])) return 'risk'
    if (includesAny(text, ['值得投', '匹配', '适合'])) return 'fit'
    if (includesAny(text, ['时间不够', '时间有限', '课程'])) return 'time'
    if (includesAny(text, ['隐私', '手机号', '身份证', '学号'])) return 'privacy'
  }
  return 'generic'
}

export function createMockAIService(options: MockAIOptions = {}): AIService {
  return {
    async sendMessage(sceneId: SceneId, _history: ChatMessage[], message: string): Promise<AIResponse> {
      const intent = detectIntent(sceneId, message)
      const delayMs = options.delay === false ? 0 : 500 + Math.floor(Math.random() * 401)
      if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs))
      return { intent, content: responseText[sceneId][intent] ?? responseText[sceneId].generic, delayMs }
    },
  }
}

export const mockAIService = createMockAIService()
