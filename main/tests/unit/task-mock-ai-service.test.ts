import { describe, expect, it } from 'vitest'
import { createTaskMockAIService } from '../../src/features/ai/task-mock-ai-service'
import { createInitialItinerary } from '../../src/features/assessment/task-flow'

describe('task-specific mock AI', () => {
  const service = createTaskMockAIService({ delay: false })

  it('adds source context without declaring a claim false', async () => {
    const response = await service.sendMessage({
      taskId: 'headphones',
      message: '95% 的用户满意是从哪里来的？',
      messages: [],
      currentContext: { selectedClaims: ['satisfaction'] },
    })

    expect(response.intent).toBe('satisfaction_source')
    expect(response.content).toContain('无法提供')
    expect(response.content).not.toContain('这句话是假的')
  })

  it('returns a structured itinerary suggestion for the trip task', async () => {
    const response = await service.sendMessage({
      taskId: 'trip',
      message: '周六会不会太赶？能不能减少换乘？',
      messages: [],
      currentContext: { itinerary: createInitialItinerary() },
    })

    expect(response.intent).toBe('pace_transport')
    expect(response.suggestedItinerary?.some((item) => item.day === 'sunday' && item.title.includes('灵隐寺'))).toBe(true)
  })

  it('returns a structured report suggestion for a source-check prompt', async () => {
    const response = await service.sendMessage({
      taskId: 'report',
      message: '这些引用是真实的吗？',
      messages: [],
      currentContext: {
        report: {
          title: '在线教育',
          body: 'Johnson 等（2021）证明在线教育显著提高成绩，因此高校应全面扩大在线课程。',
        },
      },
    })

    expect(response.intent).toBe('real_references')
    expect(response.suggestedReport?.body).not.toContain('Johnson')
    expect(response.suggestedReport?.body).toContain('需补充可检索来源')
  })
})
