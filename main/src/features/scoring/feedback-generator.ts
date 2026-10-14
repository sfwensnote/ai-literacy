import type { AssessmentSession, Dimension, DimensionScores, Evidence } from '../assessment/types'
import { calculateTotal } from './scoring-service'
import { getProficiencyLevel, type ProficiencyLevel } from './proficiency-levels'

export interface CapabilityItem { label: string; value: number }

export interface DimensionFeedback {
  name: string
  scene: string
  score: number
  summary: string
  feedback: string[]
  capabilities: CapabilityItem[]
  suggestions: string[]
  behaviors: string[]
  level: ProficiencyLevel
}

export interface FeedbackModel {
  total: number
  overallSummary: string
  overallSuggestions: string[]
  dimensions: Record<Dimension, DimensionFeedback>
}

const meta: Record<Dimension, { name: string; scene: string; labels: string[]; suggestions: string[] }> = {
  information_judgement: {
    name: '信息理解与判断', scene: 'AI 辅助报告撰写',
    labels: ['关键信息提取', '来源辨识', '信息比较', '判断表达'],
    suggestions: ['进一步验证信息来源', '比较不同立场与证据', '在结论中区分事实和推断'],
  },
  ai_use: {
    name: 'AI 使用与问题解决', scene: '社团杭州采风筹备',
    labels: ['任务拆解', '提示表达', '条件补充', '结果优化'],
    suggestions: ['先将复杂需求拆成子问题', '在提示中补充约束与偏好', '比较多个方案后再定稿'],
  },
  ai_evaluation: {
    name: 'AI 评价与批判性分析', scene: '耳机选购判断',
    labels: ['质疑意识', '来源核查', '采纳判断', '纠错修正'],
    suggestions: ['对强结论追问原始依据', '用独立测评交叉核验产品信息', '明确自己的购买判断标准'],
  },
  ai_responsibility: {
    name: 'AI 责任与合理使用', scene: '社团合作实习判断',
    labels: ['信息边界', '隐私保护', '风险意识', '独立决策'],
    suggestions: ['只提供完成任务所必需的信息', '主动评估 AI 建议的现实风险', '把最终决策权留给自己'],
  },
}

function fallbackFeedback(dimension: Dimension): string[] {
  const name = meta[dimension].name
  return [`你完成了与“${name}”相关的情境任务。`, '本页依据你提交的最终结果生成反馈。', '更多主动追问与修改会让反馈更具体。']
}

export function generateFeedback(
  _session: AssessmentSession,
  evidence: Evidence[],
  scores: DimensionScores,
): FeedbackModel {
  const dimensions = Object.keys(meta).reduce((result, key) => {
    const dimension = key as Dimension
    const matching = evidence.filter((item) => item.dimension === dimension)
    const feedback = [...matching.map((item) => item.description), ...fallbackFeedback(dimension)].slice(0, 3)
    const behaviors = matching.length ? matching.map((item) => item.description).slice(0, 4) : fallbackFeedback(dimension)
    const score = scores[dimension]
    result[dimension] = {
      name: meta[dimension].name,
      scene: meta[dimension].scene,
      score,
      summary: score >= 82 ? '你在这一维度表现稳定，能够主动做出较成熟的选择。' : score >= 70 ? '你已经形成良好基础，在关键环节仍有提升空间。' : '你开始关注这一能力，建议在真实任务中继续练习。',
      feedback,
      behaviors,
      level: getProficiencyLevel(dimension, score),
      capabilities: meta[dimension].labels.map((label, index) => ({ label, value: Math.max(45, Math.min(96, score + [3, -4, 1, -6][index])) })),
      suggestions: meta[dimension].suggestions,
    }
    return result
  }, {} as Record<Dimension, DimensionFeedback>)

  const total = calculateTotal(scores)
  return {
    total,
    overallSummary: total >= 80
      ? '你已经具备较好的 AI 使用基础，能够在不同情境中主动利用 AI，并保留自己的判断。'
      : '你能够使用 AI 完成不同任务，但在信息核验、迭代调整和独立判断方面仍有提升空间。',
    overallSuggestions: ['加强信息核查', '提升批判性思考', '保持独立判断'],
    dimensions,
  }
}
