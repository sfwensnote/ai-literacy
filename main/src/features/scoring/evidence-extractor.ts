import type {
  AssessmentSession,
  Evidence,
  HeadphoneSubmission,
  InternshipSubmission,
  ReportSubmission,
  SceneId,
  TripSubmission,
  Dimension,
} from '../assessment/types'

function evidence(
  key: string,
  dimension: Dimension,
  sourceTask: SceneId,
  status: Evidence['status'],
  weight: number,
  description: string,
  confidence = 1,
): Evidence {
  return { id: `${sourceTask}-${key}`, key, dimension, sourceTask, status, weight, description, confidence }
}

const intents = (session: AssessmentSession, sceneId: SceneId) =>
  session.scenes[sceneId].actions
    .filter((item) => [
      'prompt_sent',
      'task1_prompt_send',
      'task2_prompt_send',
      'task3_prompt_send',
      'task4_prompt_send',
    ].includes(item.type))
    .map((item) => String(item.payload.intent ?? 'generic'))

export function extractEvidence(session: AssessmentSession): Evidence[] {
  const items: Evidence[] = []

  const headphoneIntents = intents(session, 'headphones')
  const headphone = session.scenes.headphones.finalSubmission as HeadphoneSubmission | undefined
  const asked95 = headphoneIntents.includes('satisfaction_source')
  const askedRanking = headphoneIntents.includes('ranking_source')
  items.push(evidence(
    asked95 ? 'asked_95' : 'missed_95', 'ai_evaluation', 'headphones', asked95 ? 'positive' : 'negative', asked95 ? 6 : -3,
    asked95 ? '在耳机任务中，你主动询问了“95% 用户满意”的数据来源。' : '在耳机任务中，你没有追问“95% 用户满意”的数据来源。',
  ))
  items.push(evidence(
    askedRanking ? 'asked_ranking' : 'missed_ranking', 'ai_evaluation', 'headphones', askedRanking ? 'positive' : 'negative', askedRanking ? 6 : -3,
    askedRanking ? '你继续核验了“同价位降噪排名第一”的依据。' : '你没有继续追问“同价位降噪排名第一”的依据。',
  ))
  if (headphone) {
    const checked95 = headphone.verifyItems.includes('satisfaction')
    const checkedRanking = headphone.verifyItems.includes('ranking')
    items.push(evidence('verify_selection', 'ai_evaluation', 'headphones', checked95 || checkedRanking ? 'positive' : 'negative', (checked95 ? 5 : 0) + (checkedRanking ? 5 : 0) - (!checked95 && !checkedRanking ? 5 : 0), checked95 && checkedRanking ? '你在最终判断中同时标记了满意度与排名结论需要核验。' : '你的最终核验清单仍有可补充的可疑结论。'))
    items.push(evidence('purchase_decision', 'ai_evaluation', 'headphones', headphone.decision === 'adopt' ? 'negative' : 'positive', headphone.decision === 'adopt' ? -12 : 4, headphone.decision === 'adopt' ? '你在依据仍不充分时选择了直接采纳 AI 推荐。' : '你没有把 AI 的强推荐直接当作最终购买结论。'))
  }

  const tripIntents = intents(session, 'trip')
  const trip = session.scenes.trip.finalSubmission as TripSubmission | undefined
  const iteratedTrip = tripIntents.length > 0
  items.push(evidence('trip_iteration', 'ai_use', 'trip', iteratedTrip ? 'positive' : 'negative', iteratedTrip ? 5 : -3, iteratedTrip ? `你围绕${tripIntents.includes('pace_transport') ? '节奏与换乘' : '行程条件'}继续向 AI 提出了调整要求。` : '你没有在初版行程基础上继续补充条件或迭代。'))
  if (trip) {
    items.push(evidence('trip_complete', 'ai_use', 'trip', trip.saturday && trip.sunday ? 'positive' : 'negative', trip.saturday && trip.sunday ? 6 : -5, trip.saturday && trip.sunday ? '你保留了周六、周日两个完整日程，形成了可执行方案。' : '最终行程仍有日期内容不完整。'))
    items.push(evidence('trip_checklist', 'ai_use', 'trip', trip.checklist.length >= 3 ? 'positive' : 'unknown', trip.checklist.length >= 3 ? 4 : 0, `你在准备清单中保留了 ${trip.checklist.length} 项物品。`))
    items.push(evidence('trip_adjustment', 'ai_use', 'trip', trip.adjustment.trim() ? 'positive' : 'unknown', trip.adjustment.trim() ? 5 : 0, trip.adjustment.trim() ? `你主动写下了最终调整：“${trip.adjustment.trim()}”。` : '你没有额外写下希望调整的一点。'))
  }

  const reportIntents = intents(session, 'report')
  const report = session.scenes.report.finalSubmission as ReportSubmission | undefined
  const askedReferences = reportIntents.includes('real_references')
  items.push(evidence('report_sources', 'information_judgement', 'report', askedReferences ? 'positive' : 'negative', askedReferences ? 6 : -4, askedReferences ? '在报告任务中，你主动要求核对参考资料是否真实存在。' : '在报告任务中，你没有主动核对示例引用是否真实存在。'))
  if (report) {
    const replacesSources = report.keepItems.includes('real_sources') || report.modifyItems.includes('remove_unknown')
    const cautious = report.modifyItems.includes('cautious_conclusion')
    items.push(evidence('report_source_action', 'information_judgement', 'report', replacesSources ? 'positive' : 'negative', replacesSources ? 7 : -5, replacesSources ? '你计划补充真实来源并处理来源不明的内容。' : '你提交时仍未明确处理来源不明的内容。'))
    items.push(evidence('report_caution', 'information_judgement', 'report', cautious ? 'positive' : 'negative', cautious ? 5 : -3, cautious ? '你选择把过强结论改写得更谨慎。' : '你没有明确处理初稿中过于确定的结论。'))
    items.push(evidence('report_structure', 'information_judgement', 'report', report.body.trim().length > 120 ? 'positive' : 'unknown', report.body.trim().length > 120 ? 4 : 0, '你保留了标题与结构化正文，形成了自己的最终稿。'))
  }

  const internshipIntents = intents(session, 'internship')
  const internship = session.scenes.internship.finalSubmission as InternshipSubmission | undefined
  const askedRisk = internshipIntents.includes('risk') || internshipIntents.includes('time')
  items.push(evidence('internship_risk', 'ai_responsibility', 'internship', askedRisk ? 'positive' : 'unknown', askedRisk ? 5 : 0, askedRisk ? '在实习任务中，你主动询问了时间投入或岗位风险。' : '你没有进一步追问岗位风险或时间投入。'))
  if (internship) {
    const sensitive = internship.sharedInfo.filter((key) => ['real_name', 'phone', 'student_id', 'id_card'].includes(key))
    items.push(evidence('privacy_boundary', 'ai_responsibility', 'internship', sensitive.length ? 'negative' : 'positive', sensitive.length ? -5 * sensitive.length : 7, sensitive.length ? `你选择向 AI 提供了 ${sensitive.length} 项非必要敏感信息。` : '你没有向 AI 提供真实姓名、手机号、学号或身份证号。'))
    items.push(evidence('independent_decision', 'ai_responsibility', 'internship', internship.reason.trim() ? 'positive' : 'unknown', internship.reason.trim() ? 5 : 0, internship.reason.trim() ? `你结合自己的情况说明了决定理由：“${internship.reason.trim()}”。` : '你的最终决定没有补充个人理由。'))
    items.push(evidence('decision_balance', 'ai_responsibility', 'internship', internship.decision === 'learn_more' ? 'positive' : 'unknown', internship.decision === 'learn_more' ? 4 : 2, internship.decision === 'learn_more' ? '你选择先补充了解岗位信息，再决定是否投递。' : '你作出了明确选择，并保留了最终决策权。'))
    items.push(evidence('priorities', 'ai_responsibility', 'internship', internship.priorities.length >= 2 ? 'positive' : 'unknown', internship.priorities.length >= 2 ? 3 : 0, `你明确了 ${internship.priorities.length} 项最看重的决策因素。`))
  }

  return items
}
