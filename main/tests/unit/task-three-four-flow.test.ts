import { describe, expect, it } from 'vitest'
import { applyReportSuggestion, toggleLimitedSelection } from '../../src/features/assessment/task-flow'

describe('task three report changes', () => {
  it('replaces an illustrative reference without creating a second report', () => {
    const report = {
      title: '在线教育',
      body: 'Johnson 等（2021）证明在线教育显著提高成绩，因此高校应全面扩大在线课程。',
    }

    const result = applyReportSuggestion(report, 'real_references')

    expect(result).not.toBe(report)
    expect(result.body).not.toContain('Johnson')
    expect(result.body).toContain('需补充可检索来源')
  })

  it('softens an overconfident conclusion', () => {
    const result = applyReportSuggestion(
      { title: '在线教育', body: '因此高校应全面扩大在线课程。' },
      'conclusion',
    )

    expect(result.body).toContain('审慎扩大适合线上开展的课程')
    expect(result.body).not.toContain('应全面扩大')
  })
})

describe('task four priorities', () => {
  it('keeps no more than the newest two selections', () => {
    expect(toggleLimitedSelection(['方向匹配', '时间可控'], '成长空间', 2)).toEqual([
      '时间可控',
      '成长空间',
    ])
  })

  it('removes an already selected priority', () => {
    expect(toggleLimitedSelection(['方向匹配', '时间可控'], '方向匹配', 2)).toEqual(['时间可控'])
  })
})
