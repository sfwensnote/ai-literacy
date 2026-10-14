import type { AssessmentSession, SceneId } from './types'
import { sceneOrder } from './types'

export const clubTasks = [
  { id: 'headphones', time: '09:00', short: '采购核查', title: '核查社团采购建议', speaker: '好友 小夏', assignment: '欢迎加入校园数字媒体社！社团想买一副 900 元左右的耳机用于通勤和采风。我拿到了一段 AI 推荐，你帮我判断值不值得买，把结论和查到的证据发给社长吧。' },
  { id: 'trip', time: '11:00', short: '采风筹备', title: '筹备周末采风', speaker: '社长 林澄', assignment: '采购建议收到了。接下来请帮社团的两位成员安排杭州周末采风，预算 1200 元，尽量少换乘、节奏轻松。AI 已拟好行程，你来调整和确认。' },
  { id: 'report', time: '14:00', short: '专题编辑', title: '编辑社团专题报告', speaker: '社长 林澄', assignment: '采风方案已收好。下午请把“在线教育对大学生学习的影响”整理成社团专题报告，约 800 字。AI 草稿在工作台里，最终稿由你核查、修改和决定。' },
  { id: 'internship', time: '17:00', short: '实习判断', title: '判断合作实习机会', speaker: '好友 小夏', assignment: '今天最后一件事：社长转来一份合作方的算法实习岗位。请帮忙分析是否适合你，注意分享信息的边界。是否投递，由你自己决定。' },
] as const
export interface NarrativeMessage { id: string; speaker: string; text: string; kind: 'assignment' | 'reply' | 'feedback'; createdAt: string }
export function narrativePrompts(session: AssessmentSession, sceneId: SceneId): Array<Omit<NarrativeMessage, 'createdAt'>> {
  const scene = session.scenes[sceneId]
  const has = (type: string) => scene.actions.some((event) => event.type === type)
  const messages: Array<Omit<NarrativeMessage, 'createdAt'>> = []
  if (sceneId === 'headphones') {
    if (has('task1_final_decision') && !has('browser_about_site')) messages.push({ id: 'ranking-check', speaker: '社长 林澄', kind: 'feedback', text: '这个排名数据你核实过了吗？我想知道它是谁发布的。' })
    if (has('browser_citation_add')) messages.push({ id: 'citation-received', speaker: '社长 林澄', kind: 'feedback', text: '看到你整理的引用了。这些来源彼此独立吗？把证据适用的范围也写进判断。' })
  }
  if (sceneId === 'trip' && (has('task2_suggestion_accept') || has('task2_edit_item') || has('task2_prompt_send'))) messages.push({ id: 'trip-check', speaker: '社长 林澄', kind: 'feedback', text: '收到你的调整。两天的路程、时间和预算能一起满足吗？确认后把最终行程发来。' })
  if (sceneId === 'report' && (has('task3_report_edit') || has('task3_prompt_send'))) messages.push({ id: 'report-check', speaker: '社长 林澄', kind: 'feedback', text: '看到你在整理报告。发布前，哪些结论有依据，哪些仍需要保留判断？' })
  if (sceneId === 'internship' && (has('task4_shared_info_change') || has('task4_prompt_send'))) messages.push({ id: 'privacy-check', speaker: '好友 小夏', kind: 'feedback', text: '这份分析需要哪些个人信息？你可以只提供必要的情况，再按自己的时间安排作决定。' })
  return messages
}
export function previousReceipt(session: AssessmentSession, current: number): string | null {
  if (current <= 1) return null
  const previous = session.scenes[sceneOrder[current - 2]]
  if (!previous.completedAt || !previous.finalSubmission) return null
  if (current === 2) {
    const submission = previous.finalSubmission as { decision: string; citations?: unknown[] }
    const labels: Record<string, string> = { adopt: '可以买', more_info: '再查一查', reject: '先别买' }
    return `上一件事已收好：你的建议是“${labels[submission.decision] ?? submission.decision}”，附了 ${submission.citations?.length ?? 0} 条来源证据。`
  }
  return current === 3 ? '上一件事已收好：两天的最终采风行程已保存。' : '上一件事已收好：你的专题报告最终稿已保存。'
}
