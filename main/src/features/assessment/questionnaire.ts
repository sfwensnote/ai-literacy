import type { QuestionnaireResponse } from './types'

export type AttitudeDomain = 'openness' | 'ai_attitude' | 'misinformation_susceptibility'
export const attitudeDomains: Record<AttitudeDomain, string> = { openness: '开放思维', ai_attitude: 'AI 态度', misinformation_susceptibility: '误信易感性' }
export const questionnaireItems: Array<{ id: string; domain: AttitudeDomain; text: string; reverse?: boolean }> = [
  { id: 'open_1', domain: 'openness', text: '遇到和自己看法不同的信息，我愿意了解它的依据。' },
  { id: 'open_2', domain: 'openness', text: '如果出现新的可靠证据，我愿意调整原来的判断。' },
  { id: 'open_3', domain: 'openness', text: '一旦形成看法，我就不太愿意再考虑其他解释。', reverse: true },
  { id: 'ai_1', domain: 'ai_attitude', text: '我愿意尝试用 AI 辅助学习或完成任务。' },
  { id: 'ai_2', domain: 'ai_attitude', text: '我愿意花时间学习如何更有效地与 AI 协作。' },
  { id: 'ai_3', domain: 'ai_attitude', text: '我觉得学习使用 AI 对我没有什么价值。', reverse: true },
  { id: 'trust_1', domain: 'misinformation_susceptibility', text: 'AI 的回答只要语气很肯定，我通常就会相信。' },
  { id: 'trust_2', domain: 'misinformation_susceptibility', text: '一条信息被很多账号转发，我就觉得它比较可靠。' },
  { id: 'trust_3', domain: 'misinformation_susceptibility', text: '即使回答写得很专业，我仍会先核查重要结论的来源。', reverse: true },
]
export const agreementLabels = ['非常不同意', '不同意', '不确定', '同意', '非常同意']
export function isQuestionnaireComplete(response?: QuestionnaireResponse): boolean {
  return questionnaireItems.every(({ id }) => Number.isInteger(response?.answers[id]) && response!.answers[id] >= 1 && response!.answers[id] <= 5)
}
export function summarizeQuestionnaire(response?: QuestionnaireResponse): Record<AttitudeDomain, number | null> {
  return Object.fromEntries(Object.keys(attitudeDomains).map((domain) => {
    const items = questionnaireItems.filter((item) => item.domain === domain)
    const values = items.map((item) => response?.answers[item.id])
    const valid = values.every((value) => Number.isInteger(value) && value! >= 1 && value! <= 5)
    const mean = valid ? items.reduce((sum, item, index) => sum + (item.reverse ? 6 - values[index]! : values[index]!), 0) / items.length : null
    return [domain, mean === null ? null : Math.round(mean * 100) / 100]
  })) as Record<AttitudeDomain, number | null>
}
