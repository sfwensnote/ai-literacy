import type { Dimension } from '../assessment/types'

export interface ProficiencyLevel { band: 'low' | 'medium' | 'high'; label: string; complexity: string; autonomy: string; description: string }
const descriptions: Record<Dimension, [string, string, string]> = {
  information_judgement: ['在明确提示下识别信息和来源，处理单一、直接的信息；仍需要帮助区分事实与推断。', '能够自主处理熟悉情境的信息，核查出处、比较观点，并说明结论的依据。', '能够在来源冲突或信息不完整时整合多方证据，识别局限，并形成有条件的判断。'],
  ai_use: ['在示例或提示下向 AI 提出简单需求，完成步骤明确的任务。', '能够自主补充约束、迭代提示并修改 AI 结果，完成熟悉的多步骤任务。', '能够拆解复杂任务，协调多个约束、比较不同方案，并自主检验和优化结果。'],
  ai_evaluation: ['在提醒下注意 AI 回答中的可疑内容，借助给定线索进一步确认。', '能够自主追问重要结论，通过外部来源比较 AI 输出，再决定是否采纳。', '能够在复杂或相互矛盾的信源间横向查证，解释商业关系与方法局限，并据证据修正判断。'],
  ai_responsibility: ['在提示下保护个人信息，识别直接风险，并意识到最终决定由人负责。', '能够自主控制信息边界，权衡个人条件与 AI 建议，说明独立决定的理由。', '能够在多方利益与不确定风险中评估影响，提出保护措施，并自主承担和解释决策。'],
}
export function getProficiencyLevel(dimension: Dimension, score: number): ProficiencyLevel {
  const index = score < 65 ? 0 : score < 80 ? 1 : 2
  return {
    band: (['low', 'medium', 'high'] as const)[index],
    label: ['低阶 · 支持下完成', '中阶 · 自主处理', '高阶 · 复杂整合'][index],
    complexity: ['简单、步骤明确', '熟悉的多步骤任务', '复杂或不确定任务'][index],
    autonomy: ['需要提示或支持', '能够自主完成', '自主权衡与调整'][index],
    description: descriptions[dimension][index],
  }
}
