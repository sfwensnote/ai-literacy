import { describe, expect, it } from 'vitest'
import {
  moveBrowserHistory,
  pushBrowserHistory,
} from '../../src/features/assessment/browser-navigation'
import {
  findBrowserSource,
  searchBrowserSources,
  validateCitation,
} from '../../src/features/assessment/browser-sources'
import {
  isWorkspaceTab,
  taskContext,
  initialWorkspaceDraft,
} from '../../src/features/assessment/workspace-config'
import { createAssessmentSession } from '../../src/features/assessment/session-store'
import { extractEvidence } from '../../src/features/scoring/evidence-extractor'

describe('desktop navigation and contextual sources', () => {
  it('supports the distinct fourth workspace and selected-claim handoff', () => {
    expect(isWorkspaceTab('workspace')).toBe(true)
    expect(isWorkspaceTab('unknown')).toBe(false)
    expect(
      taskContext('headphones', {
        ...initialWorkspaceDraft('headphones'),
        selectedClaims: ['ranking', 'satisfaction'],
      }),
    ).toContain('95%')
  })
  it('bounds history and discards a forward branch after a new navigation', () => {
    const initial = {
      entries: [{ active: 'search', query: '', view: 'article' as const }],
      index: 0,
    }
    const first = pushBrowserHistory(initial, { active: 'brand', query: '', view: 'article' })
    const second = pushBrowserHistory(first, { active: 'lab', query: '', view: 'site' })
    const back = moveBrowserHistory(second, -1)
    expect(back.index).toBe(1)
    expect(moveBrowserHistory(back, 1).entries[2].active).toBe('lab')
    const branch = pushBrowserHistory(back, { active: 'ranking', query: '', view: 'article' })
    expect(branch.entries.map((entry) => entry.active)).toEqual(['search', 'brand', 'ranking'])
    expect(moveBrowserHistory(initial, -1).index).toBe(0)
    expect(pushBrowserHistory(initial, initial.entries[0])).toBe(initial)
  })
  it('keeps sources within their task while recognizing a compound query', () => {
    expect(
      searchBrowserSources('同价位降噪表现突出 95% 用户满意').some(
        (source) => source.id === 'survey',
      ),
    ).toBe(true)
    expect(searchBrowserSources('', 'trip').every((source) => source.sceneId === 'trip')).toBe(true)
    expect(searchBrowserSources('', 'report').some((source) => source.id === 'report-review')).toBe(
      true,
    )
    const source = findBrowserSource('internship-privacy')!
    expect(
      validateCitation({ sourceId: source.id, url: source.url, excerpt: source.content[0] }),
    ).toBe(true)
    expect(searchBrowserSources('没有这份资料', 'internship')).toEqual([])
  })
  it('retains research evidence from non-purchase tasks without reward stacking', () => {
    const session = createAssessmentSession()
    const source = findBrowserSource('report-review')!
    session.scenes.report.actions = [
      {
        id: '1',
        sceneId: 'report',
        type: 'browser_source_open',
        payload: { sourceId: source.id },
        createdAt: '',
      },
      {
        id: '2',
        sceneId: 'report',
        type: 'browser_about_author',
        payload: { sourceId: source.id },
        createdAt: '',
      },
    ]
    session.scenes.report.finalSubmission = {
      title: '报告',
      body: '正文',
      keepItems: [],
      modifyItems: [],
      citations: [{ sourceId: source.id, url: source.url, excerpt: source.content[0] }],
    }
    const before = extractEvidence(session)
    session.scenes.report.actions.push({ ...session.scenes.report.actions[1], id: '3' })
    expect(extractEvidence(session)).toEqual(before)
    expect(
      before.some((item) => item.key === 'traceable_sources' && item.sourceTask === 'report'),
    ).toBe(true)
  })
})
