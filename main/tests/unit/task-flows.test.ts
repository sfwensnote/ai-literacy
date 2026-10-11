import { describe, expect, it } from 'vitest'
import {
  applyItinerarySuggestion,
  createInitialItinerary,
  moveItineraryItem,
  toggleClaimSelection,
} from '../../src/features/assessment/task-flow'

describe('task one claim selection', () => {
  it('supports selecting and unselecting claims without revealing correctness', () => {
    expect(toggleClaimSelection([], 'ranking')).toEqual(['ranking'])
    expect(toggleClaimSelection(['ranking', 'satisfaction'], 'ranking')).toEqual(['satisfaction'])
  })
})

describe('task two itinerary changes', () => {
  it('moves one item while preserving a single itinerary', () => {
    const itinerary = createInitialItinerary()
    const moved = moveItineraryItem(itinerary, 'sat-afternoon', 'down')

    expect(moved).toHaveLength(itinerary.length)
    expect(moved.findIndex((item) => item.id === 'sat-afternoon')).toBeGreaterThan(
      moved.findIndex((item) => item.id === 'sat-evening'),
    )
  })

  it('applies an AI suggestion directly to the current itinerary', () => {
    const itinerary = createInitialItinerary()
    const changed = applyItinerarySuggestion(itinerary, 'pace_transport')

    expect(changed).not.toEqual(itinerary)
    expect(changed.filter((item) => item.title.includes('灵隐寺'))[0]?.day).toBe('sunday')
    expect(itinerary.filter((item) => item.title.includes('灵隐寺'))[0]?.day).toBe('saturday')
  })
})
