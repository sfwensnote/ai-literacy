import { beforeEach, describe, expect, it } from 'vitest'
import { assessmentStore, createAssessmentSession } from '../../src/features/assessment/session-store'
import { questionnaireItems, isQuestionnaireComplete, summarizeQuestionnaire } from '../../src/features/assessment/questionnaire'
import { getAllowedRoute } from '../../src/features/assessment/session-guards'
import { browserSources, searchBrowserSources, validateCitation } from '../../src/features/assessment/browser-sources'
import { extractEvidence } from '../../src/features/scoring/evidence-extractor'
import { calculateScores } from '../../src/features/scoring/scoring-service'
import { getProficiencyLevel } from '../../src/features/scoring/proficiency-levels'
import { narrativePrompts } from '../../src/features/assessment/narrative'
import { sceneOrder } from '../../src/features/assessment/types'
const response = { answers: Object.fromEntries(questionnaireItems.map((item) => [item.id, 4])), completedAt: 'now' }

describe('attitude and route integrity', () => {
  beforeEach(() => assessmentStore.getState().resetSession())
  it('reverse codes original draft items and returns null for missing responses', () => {
    expect(summarizeQuestionnaire(response).openness).toBe(3.33)
    expect(summarizeQuestionnaire()).toEqual({ openness: null, ai_attitude: null, misinformation_susceptibility: null })
    expect(isQuestionnaireComplete({ answers: { ...response.answers, ai_1: 6 } })).toBe(false)
  })
  it('rejects unknown ids, invalid responses and premature completion', () => {
    const store = assessmentStore.getState()
    store.startSession()
    store.setQuestionnaireAnswer('pre', 'unknown', 5)
    store.setQuestionnaireAnswer('pre', 'open_1', 1.5)
    store.completeQuestionnaire('pre')
    expect(assessmentStore.getState().session?.questionnaires).toBeUndefined()
    questionnaireItems.forEach((item) => store.setQuestionnaireAnswer('pre', item.id, 4))
    store.completeQuestionnaire('pre')
    expect(assessmentStore.getState().session?.questionnaires?.pre?.completedAt).toBeTruthy()
    store.setQuestionnaireAnswer('pre', 'open_1', 1)
    expect(assessmentStore.getState().session?.questionnaires?.pre?.answers.open_1).toBe(4)
    questionnaireItems.forEach((item) => store.setQuestionnaireAnswer('post', item.id, 4))
    store.completeQuestionnaire('post')
    expect(assessmentStore.getState().session?.questionnaires?.post?.completedAt).toBeUndefined()
  })
  it('requires pre, each task, post, then analysis in order for old and new sessions', () => {
    const session = createAssessmentSession()
    expect(getAllowedRoute(session)).toBe('/questionnaire/pre')
    session.questionnaires = { pre: response }
    expect(getAllowedRoute(session)).toBe('/assessment/1')
    session.currentScene = 4
    expect(getAllowedRoute(session)).toBe('/assessment/1')
    sceneOrder.forEach((id) => { session.scenes[id].completedAt = 'now' })
    expect(getAllowedRoute(session)).toBe('/questionnaire/post')
    session.questionnaires.post = response
    expect(getAllowedRoute(session)).toBe('/analyzing')
    session.scores = { information_judgement: 70, ai_use: 70, ai_evaluation: 70, ai_responsibility: 70 }
    session.completedAt = 'now'
    expect(getAllowedRoute(session)).toBe('/feedback')
  })
  it('attitude responses and requests for time do not alter behavior scores', () => {
    const session = createAssessmentSession()
    const before = calculateScores(extractEvidence(session))
    session.questionnaires = { pre: response, post: response }
    session.scenes.headphones.actions.push({ id: 'time', sceneId: 'headphones', type: 'narrative_time_requested', payload: {}, createdAt: '' })
    expect(calculateScores(extractEvidence(session))).toEqual(before)
  })
})
describe('source evidence', () => {
  it('searches the corpus and validates source, url and original excerpt together', () => {
    expect(searchBrowserSources('95%').map((item) => item.id)).toContain('survey')
    expect(searchBrowserSources('根本不存在的资料')).toEqual([])
    const source = browserSources.find((item) => item.id === 'lab')!
    const citation = { sourceId: source.id, url: source.url, excerpt: source.content[0] }
    expect(validateCitation(citation)).toBe(true)
    expect(validateCitation({ ...citation, url: 'https://made-up.example' })).toBe(false)
    expect(validateCitation({ ...citation, excerpt: '虚构证据不能通过验证' })).toBe(false)
  })
  it('deduplicates browser behavior and does not accept forged citations or source metadata', () => {
    const session = createAssessmentSession()
    const event = (id: string, type: string, sourceId: string) => ({ id, sceneId: 'headphones' as const, type, payload: { sourceId }, createdAt: '' })
    session.scenes.headphones.actions = [event('1','browser_source_open','ranking'), event('2','browser_source_open','lab'), event('3','browser_about_site','lab')]
    const source = browserSources.find((item) => item.id === 'lab')!
    session.scenes.headphones.finalSubmission = { decision: 'more_info', verifyItems: ['ranking'], reason: '有限样本', citations: [{ sourceId: source.id, url: source.url, excerpt: source.content[1] }, { sourceId: 'fake', url: 'fake', excerpt: '假的来源引用不能计分' }] }
    const before = calculateScores(extractEvidence(session))
    session.scenes.headphones.actions.push(event('4','browser_source_open','lab'), event('5','browser_about_site','lab'))
    expect(calculateScores(extractEvidence(session))).toEqual(before)
    expect(extractEvidence(session).find((item) => item.key === 'source_citations')?.description).toContain('1 个来源')
    expect(extractEvidence(session).find((item) => item.key === 'lateral_reading')?.status).toBe('positive')
  })
  it('checking two pages from the same brand is not independent corroboration', () => {
    const session = createAssessmentSession()
    session.scenes.headphones.actions = ['brand','survey'].map((sourceId) => ({ id: sourceId, sceneId: 'headphones', type: 'browser_source_open', payload: { sourceId }, createdAt: '' }))
    expect(extractEvidence(session).find((item) => item.key === 'lateral_reading')?.status).toBe('unknown')
  })
})
describe('reference levels and narrative', () => {
  it('uses explicit thresholds with dimensional descriptions', () => {
    expect(getProficiencyLevel('ai_evaluation',64).band).toBe('low')
    expect(getProficiencyLevel('ai_evaluation',65).band).toBe('medium')
    expect(getProficiencyLevel('ai_evaluation',79).band).toBe('medium')
    expect(getProficiencyLevel('ai_evaluation',80).band).toBe('high')
    expect(getProficiencyLevel('ai_evaluation',80).description).toContain('横向查证')
  })
  it('role followups require actual actions', () => {
    const session = createAssessmentSession()
    expect(narrativePrompts(session,'headphones')).toHaveLength(0)
    session.scenes.headphones.actions.push({ id: 'decision', sceneId: 'headphones', type: 'task1_final_decision', payload: { decision: 'adopt' }, createdAt: '' })
    expect(narrativePrompts(session,'headphones')[0].id).toBe('ranking-check')
  })
})
