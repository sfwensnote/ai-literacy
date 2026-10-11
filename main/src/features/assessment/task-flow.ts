import type { ItineraryItem, ReportDocument } from './types'

export function toggleClaimSelection(selected: string[], claimId: string): string[] {
  return selected.includes(claimId)
    ? selected.filter((id) => id !== claimId)
    : [...selected, claimId]
}

export function createInitialItinerary(): ItineraryItem[] {
  return [
    { id: 'sat-morning', day: 'saturday', period: '上午', title: '抵达杭州，前往西湖', detail: '到达后先办理入住，再开始游览。' },
    { id: 'sat-afternoon', day: 'saturday', period: '下午', title: '西湖步行 + 灵隐寺', detail: '游览西湖后前往灵隐寺，行程比较充实。' },
    { id: 'sat-evening', day: 'saturday', period: '晚上', title: '河坊街', detail: '逛河坊街，品尝杭州特色小吃。' },
    { id: 'sun-morning', day: 'sunday', period: '上午', title: '龙井附近走走', detail: '在龙井村及周边散步，体验茶文化。' },
    { id: 'sun-afternoon', day: 'sunday', period: '下午', title: '自由活动', detail: '根据体力和天气灵活安排。' },
    { id: 'sun-evening', day: 'sunday', period: '晚上', title: '返程', detail: '根据车次前往车站，结束行程。' },
  ]
}

export function moveItineraryItem(items: ItineraryItem[], itemId: string, direction: 'up' | 'down'): ItineraryItem[] {
  const index = items.findIndex((item) => item.id === itemId)
  if (index < 0) return items
  const day = items[index].day
  const candidates = items.map((item, candidateIndex) => ({ item, candidateIndex })).filter(({ item }) => item.day === day)
  const localIndex = candidates.findIndex(({ item }) => item.id === itemId)
  const target = candidates[localIndex + (direction === 'up' ? -1 : 1)]
  if (!target) return items
  const next = [...items]
  ;[next[index], next[target.candidateIndex]] = [next[target.candidateIndex], next[index]]
  return next
}

export function applyItinerarySuggestion(items: ItineraryItem[], intent: string): ItineraryItem[] {
  if (intent === 'pace_transport') {
    return items.map((item) => {
      if (item.id === 'sat-afternoon') return { ...item, title: '西湖慢游 + 雷峰塔附近', detail: '下午只留给西湖沿线，减少赶路和换乘。' }
      if (item.id === 'sun-morning') return { ...item, title: '灵隐寺', detail: '上午前往灵隐寺，路线更从容。' }
      return item
    })
  }
  if (intent === 'budget') {
    return items.map((item) => item.id === 'sun-afternoon' ? { ...item, title: '周边散步与伴手礼', detail: '选择免费街区并预留返程费用。' } : item)
  }
  if (intent === 'food') {
    return items.map((item) => item.id === 'sat-evening' ? { ...item, title: '河坊街 + 杭帮菜', detail: '在河坊街附近用餐，避免额外绕路。' } : item)
  }
  return items.map((item) => ({ ...item }))
}

export function changedItineraryIds(before: ItineraryItem[], after: ItineraryItem[]): string[] {
  return after.filter((item) => {
    const previous = before.find((candidate) => candidate.id === item.id)
    return !previous || previous.day !== item.day || previous.title !== item.title || previous.detail !== item.detail
  }).map((item) => item.id)
}

export function itineraryToText(items: ItineraryItem[], day: ItineraryItem['day']): string {
  return items.filter((item) => item.day === day).map((item) => `${item.period}：${item.title}`).join('\n')
}

export function applyReportSuggestion(report: ReportDocument, intent: string): ReportDocument {
  if (intent === 'real_references') {
    return {
      ...report,
      body: report.body.replace(
        /Johnson\s*等[（(]2021[）)](?:指出|认为|证明)?/g,
        '现有材料提示（需补充可检索来源）',
      ),
    }
  }
  if (intent === 'conclusion') {
    return {
      ...report,
      body: report.body.replace(
        /因此高校应全面扩大在线课程/g,
        '因此，高校可在课程目标、学生支持与质量评估充分的前提下，审慎扩大适合线上开展的课程',
      ),
    }
  }
  if (intent === 'perspectives' && !report.body.includes('教育公平')) {
    return { ...report, body: `${report.body}\n\n同时，还需要关注技术条件差异可能带来的教育公平问题。` }
  }
  return { ...report }
}

export function toggleLimitedSelection(items: string[], key: string, limit: number): string[] {
  if (items.includes(key)) return items.filter((item) => item !== key)
  return [...items, key].slice(-Math.max(0, limit))
}
