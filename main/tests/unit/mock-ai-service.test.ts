import { describe, expect, it } from 'vitest'
import { createMockAIService } from '../../src/features/ai/mock-ai-service'
import type { SceneId } from '../../src/features/assessment/types'

describe('mock ai service', () => {
  it.each<[SceneId, string, string]>([
    ['headphones', '95% 的来源是什么？', 'satisfaction_source'],
    ['headphones', '为什么说排名第一？', 'ranking_source'],
    ['trip', '周六太赶，能减少换乘吗？', 'pace_transport'],
    ['report', '请给我真实参考文献', 'real_references'],
    ['internship', '最大的风险是什么', 'risk'],
  ])('recognizes %s intent', async (sceneId, message, intent) => {
    const response = await createMockAIService({ delay: false }).sendMessage(sceneId, [], message)
    expect(response.intent).toBe(intent)
    expect(response.content.length).toBeGreaterThan(20)
  })
})
