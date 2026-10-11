import { expect, it } from 'vitest'
import { createAssessmentSession } from '../../src/features/assessment/session-store'
import { extractEvidence } from '../../src/features/scoring/evidence-extractor'
import { calculateScores } from '../../src/features/scoring/scoring-service'
import { generateFeedback } from '../../src/features/scoring/feedback-generator'

it('describes both observed and missing verification behaviors', () => {
  const session = createAssessmentSession()
  session.scenes.headphones.actions = [
    { id: '1', sceneId: 'headphones', type: 'prompt_sent', payload: { intent: 'satisfaction_source' }, createdAt: '' },
  ]
  session.scenes.headphones.finalSubmission = {
    decision: 'more_info', verifyItems: ['satisfaction'], reason: '满意度缺少来源',
  }
  const evidence = extractEvidence(session)
  const feedback = generateFeedback(session, evidence, calculateScores(evidence))
  const detail = feedback.dimensions.ai_evaluation.feedback.join(' ')
  expect(detail).toContain('95%')
  expect(detail).toContain('没有继续追问')
  expect(detail).toContain('排名')
})
