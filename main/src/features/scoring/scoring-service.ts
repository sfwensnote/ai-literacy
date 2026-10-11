import type { Dimension, DimensionScores, Evidence } from '../assessment/types'
import { dimensionOrder } from '../assessment/types'

const baseScores: Record<Dimension, number> = {
  information_judgement: 64,
  ai_use: 60,
  ai_evaluation: 52,
  ai_responsibility: 67,
}

export function calculateScores(items: Evidence[]): DimensionScores {
  return dimensionOrder.reduce((scores, dimension) => {
    const delta = items
      .filter((item) => item.dimension === dimension)
      .reduce((sum, item) => sum + item.weight * item.confidence, 0)
    scores[dimension] = Math.round(Math.min(100, Math.max(0, baseScores[dimension] + delta)))
    return scores
  }, {} as DimensionScores)
}

export function calculateTotal(scores: DimensionScores): number {
  return Math.round(dimensionOrder.reduce((sum, key) => sum + scores[key], 0) / dimensionOrder.length)
}
