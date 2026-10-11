import { beforeEach, describe, expect, it } from 'vitest'
import { assessmentStore, createAssessmentSession } from '../../src/features/assessment/session-store'

describe('assessment session store', () => {
  beforeEach(() => assessmentStore.getState().resetSession())

  it('records ordered events and advances after submission', () => {
    assessmentStore.getState().startSession()
    assessmentStore.getState().recordEvent('headphones', 'prompt_sent', { intent: 'source' })
    assessmentStore.getState().recordEvent('headphones', 'selection_changed', { value: '95' })
    assessmentStore.getState().submitScene('headphones', { decision: 'more_info', verifyItems: ['95'], reason: '' })

    const session = assessmentStore.getState().session!
    expect(session.scenes.headphones.actions.map((item) => item.type)).toEqual(['prompt_sent', 'selection_changed'])
    expect(session.currentScene).toBe(2)
    expect(session.scenes.headphones.finalSubmission).toMatchObject({ decision: 'more_info' })
  })

  it('does not advance twice when a completed scene is resubmitted', () => {
    assessmentStore.setState({ session: createAssessmentSession() })
    assessmentStore.getState().submitScene('headphones', { decision: 'more_info', verifyItems: [], reason: '' })
    assessmentStore.getState().submitScene('headphones', { decision: 'adopt', verifyItems: [], reason: '' })
    expect(assessmentStore.getState().session?.currentScene).toBe(2)
  })
})
