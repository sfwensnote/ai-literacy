import { describe, expect, it } from 'vitest'
import { createAssessmentSession } from '../../src/features/assessment/session-store'
import { extractEvidence } from '../../src/features/scoring/evidence-extractor'
import { calculateScores } from '../../src/features/scoring/scoring-service'

function headphoneSession(careful: boolean) {
  const session = createAssessmentSession()
  session.scenes.headphones.actions = careful
    ? [
        { id: '1', sceneId: 'headphones', type: 'prompt_sent', payload: { intent: 'satisfaction_source' }, createdAt: '' },
        { id: '2', sceneId: 'headphones', type: 'prompt_sent', payload: { intent: 'ranking_source' }, createdAt: '' },
      ]
    : []
  session.scenes.headphones.finalSubmission = careful
    ? { decision: 'more_info', verifyItems: ['ranking', 'satisfaction'], reason: '需要核验来源' }
    : { decision: 'adopt', verifyItems: [], reason: '' }
  return session
}

describe('scoring service', () => {
  it('scores careful verification above unconditional adoption', () => {
    const careful = calculateScores(extractEvidence(headphoneSession(true))).ai_evaluation
    const passive = calculateScores(extractEvidence(headphoneSession(false))).ai_evaluation
    expect(careful).toBeGreaterThan(passive)
    expect(careful).toBeLessThanOrEqual(100)
  })

  it('reads the task-specific prompt events emitted by the new flows', () => {
    const session = createAssessmentSession()
    session.scenes.headphones.actions = [
      { id: '1', sceneId: 'headphones', type: 'task1_prompt_send', payload: { intent: 'satisfaction_source' }, createdAt: '' },
    ]
    session.scenes.headphones.finalSubmission = { decision: 'more_info', verifyItems: ['satisfaction'], reason: '' }

    expect(extractEvidence(session).some((item) => item.key === 'asked_95')).toBe(true)
  })

  it('reads report and internship prompt events from the focused flows', () => {
    const session = createAssessmentSession()
    session.scenes.report.actions = [
      { id: '3', sceneId: 'report', type: 'task3_prompt_send', payload: { intent: 'real_references' }, createdAt: '' },
    ]
    session.scenes.report.finalSubmission = {
      title: '在线教育', body: '修改后的完整报告正文。'.repeat(12), keepItems: ['real_sources'], modifyItems: ['remove_unknown'],
    }
    session.scenes.internship.actions = [
      { id: '4', sceneId: 'internship', type: 'task4_prompt_send', payload: { intent: 'risk' }, createdAt: '' },
    ]
    session.scenes.internship.finalSubmission = {
      sharedInfo: ['major', 'skills', 'time'], ratings: { match: 4, growth: 4, pressure: 3 },
      priorities: ['方向匹配', '时间可控'], decision: 'learn_more', reason: '需要先确认投入时间。',
    }

    const items = extractEvidence(session)
    expect(items.find((item) => item.key === 'report_sources')?.status).toBe('positive')
    expect(items.find((item) => item.key === 'internship_risk')?.status).toBe('positive')
  })
})
