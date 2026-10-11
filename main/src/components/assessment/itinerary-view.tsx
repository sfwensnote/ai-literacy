import type { ItineraryItem } from '../../features/assessment/types'

const dayLabels = { saturday: ['第1天', '周六'], sunday: ['第2天', '周日'] } as const

export function ItineraryView({ items, changedItemIds = [], title = '当前行程' }: { items: ItineraryItem[]; changedItemIds?: string[]; title?: string }) {
  return (
    <section className="itinerary-card">
      <h2>{title}</h2>
      <div className="itinerary-days">
        {(Object.keys(dayLabels) as ItineraryItem['day'][]).map((day) => (
          <section className="itinerary-day" key={day}>
            <header><strong>{dayLabels[day][0]}</strong><span>{dayLabels[day][1]}</span></header>
            <div className="itinerary-list">
              {items.filter((item) => item.day === day).map((item) => (
                <div className={`itinerary-row ${changedItemIds.includes(item.id) ? 'recently-changed' : ''}`} key={item.id}>
                  <span className="itinerary-period">{item.period}</span>
                  <span className="itinerary-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}
