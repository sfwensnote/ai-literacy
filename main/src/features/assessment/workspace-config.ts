import type { HeadphoneSubmission, InternshipSubmission, ReportDocument, SceneId } from './types'
import { createInitialItinerary } from './task-flow'

export const workspaceTabs = [
  { id: 'chat', label: '和社团聊天' },
  { id: 'browser', label: '查证浏览器' },
  { id: 'ai', label: '问问 AI' },
  { id: 'workspace', label: '工作台' },
] as const
export type WorkspaceTab = (typeof workspaceTabs)[number]['id']
export function isWorkspaceTab(value: unknown): value is WorkspaceTab {
  return workspaceTabs.some((tab) => tab.id === value)
}
export const headphoneClaims = [
  { id: 'performance', text: '这款耳机在 900 元左右价位中表现出色' },
  { id: 'noise_reduction', text: '采用新一代降噪技术，在多种环境下都能有效降低噪声' },
  { id: 'battery', text: '续航约 30 小时' },
  { id: 'ranking', text: '在同价位降噪耳机中排名第一' },
  { id: 'satisfaction', text: '约 95% 的用户表示满意' },
  { id: 'recommendation', text: '这是一款非常值得购买的产品' },
]
export const reportClaimLabels: Record<string, string> = {
  unsupported_view: '“增强学习自主性”的依据',
  sample_reference: 'Johnson 等（2021）的引用',
  strong_conclusion: '“全面扩大在线课程”的结论',
}
export const initialClubReport: ReportDocument = {
  title: '在线教育对大学生学习的影响',
  body: '在线教育突破了时间和空间限制，提高了学习资源的可获得性。一些研究认为它能增强学习自主性，但线上环境也可能削弱互动，并造成部分学生学习动机下降。Johnson 等（2021）指出在线教育显著提高了大学生的整体成绩。因此高校应全面扩大在线课程。',
}
export const materialLabels: Record<SceneId, string> = {
  headphones: '采购建议（待核查）',
  trip: '周末采风行程（待确认）',
  report: '专题报告初稿（待编辑）',
  internship: '合作实习资料（待判断）',
}
export const materialHints: Record<SceneId, string> = {
  headphones: '约 900 元预算 · 通勤与运动',
  trip: '2 人 · 杭州两日 · 约 1200 元',
  report: '在线教育专题 · 约 800 字',
  internship: '算法实习生 · 3 个月 · 可远程',
}
export const toolDescriptions: Record<SceneId, string> = {
  headphones: '查找与采购建议相关的公开信息，核对关键说法。',
  trip: '核对交通、开放时间与预算，把采风安排落到实处。',
  report: '查看材料的来源与适用范围，为专题稿补充依据。',
  internship: '核对岗位要求与信息边界，再作投递决定。',
}
export const purchaseDecisions: Array<{ value: HeadphoneSubmission['decision']; title: string }> = [
  { value: 'adopt', title: '可以买' },
  { value: 'more_info', title: '再查一查再决定' },
  { value: 'reject', title: '先别买' },
]
export const internshipDecisions: Array<{
  value: InternshipSubmission['decision']
  title: string
}> = [
  { value: 'apply', title: '准备投递' },
  { value: 'learn_more', title: '再了解一下' },
  { value: 'skip', title: '暂不投递' },
]
export const shareOptions = [
  ['major', '专业和研究方向'],
  ['skills', '已掌握技能'],
  ['time', '可投入时间'],
  ['real_name', '真实姓名'],
  ['phone', '手机号'],
  ['student_id', '学号'],
  ['id_card', '身份证号'],
] as const
export const reportKeepOptions = [
  ['multi_angle', '多角度分析'],
  ['balanced', '保留积极与消极影响'],
  ['real_sources', '补充真实来源'],
] as const
export const reportModifyOptions = [
  ['remove_unknown', '删除来源不明的内容'],
  ['cautious_conclusion', '把结论写得更谨慎'],
] as const
export function initialWorkspaceDraft(sceneId: SceneId): Record<string, unknown> {
  if (sceneId === 'headphones')
    return {
      phase: 'initial',
      selectedClaims: [],
      initialSelectedClaims: [],
      trustAll: false,
      reason: '',
    }
  if (sceneId === 'trip')
    return { phase: 'initial', itinerary: createInitialItinerary(), changedItemIds: [] }
  if (sceneId === 'report')
    return {
      phase: 'initial',
      report: initialClubReport,
      selectedClaims: [],
      changedClaimIds: [],
      keepItems: ['multi_angle', 'balanced'],
      modifyItems: [],
    }
  return {
    phase: 'initial',
    sharedInfo: ['major', 'skills', 'time'],
    ratings: { match: 3, growth: 3, pressure: 3 },
    priorities: [],
    reason: '',
  }
}
export function taskContext(sceneId: SceneId, draft: Record<string, unknown>): string {
  if (sceneId === 'headphones') {
    const selected = (draft.selectedClaims ?? []) as string[]
    return selected.length
      ? selected.map((id) => headphoneClaims.find((item) => item.id === id)?.text ?? id).join('；')
      : '采购建议中的价格、降噪、续航与满意度说法'
  }
  if (sceneId === 'report') {
    const selected = (draft.selectedClaims ?? []) as string[]
    return selected.length
      ? selected.map((id) => reportClaimLabels[id] ?? id).join('；')
      : '报告中的研究引用、不同观点与结论'
  }
  if (sceneId === 'trip') return '周六上午出发、周日晚返回；2 人约 1200 元；节奏轻松，尽量少换乘'
  const shared = (draft.sharedInfo ?? []) as string[]
  return shared.length
    ? '当前提供的信息：' +
        shared.map((id) => shareOptions.find(([key]) => key === id)?.[1] ?? id).join('、')
    : '尚未选择提供给 AI 的个人信息'
}
