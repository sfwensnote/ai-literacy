'use client'

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { ItineraryItem } from '../../features/assessment/types'

export function ItineraryEditor({ items, onEdit, onDelete, onMove, onAdd }: {
  items: ItineraryItem[]
  onEdit: (itemId: string, patch: Partial<ItineraryItem>) => void
  onDelete: (itemId: string) => void
  onMove: (itemId: string, direction: 'up' | 'down') => void
  onAdd: (day: ItineraryItem['day']) => void
}) {
  return (
    <section className="itinerary-card itinerary-editor">
      <h2>当前行程</h2>
      <div className="itinerary-days">
        {(['saturday', 'sunday'] as const).map((day) => (
          <section className="itinerary-day" key={day}>
            <header><strong>{day === 'saturday' ? '第1天' : '第2天'}</strong><span>{day === 'saturday' ? '周六' : '周日'}</span></header>
            <div className="itinerary-list">
              {items.filter((item) => item.day === day).map((item, index, dayItems) => (
                <div className="itinerary-edit-row" key={item.id}>
                  <select aria-label={`${item.title} 时间段`} value={item.period} onChange={(event) => onEdit(item.id, { period: event.target.value as ItineraryItem['period'] })}><option>上午</option><option>下午</option><option>晚上</option></select>
                  <div><input aria-label={`${item.period}安排`} value={item.title} onChange={(event) => onEdit(item.id, { title: event.target.value })} /><input className="detail-input" aria-label={`${item.title}说明`} value={item.detail} onChange={(event) => onEdit(item.id, { detail: event.target.value })} /></div>
                  <span className="edit-actions">
                    <button type="button" aria-label={`上移 ${item.title}`} disabled={index === 0} onClick={() => onMove(item.id, 'up')}><ArrowUp /></button>
                    <button type="button" aria-label={`下移 ${item.title}`} disabled={index === dayItems.length - 1} onClick={() => onMove(item.id, 'down')}><ArrowDown /></button>
                    <button type="button" aria-label={`删除 ${item.title}`} onClick={() => onDelete(item.id)}><Trash2 /></button>
                  </span>
                </div>
              ))}
            </div>
            <button className="add-itinerary-item" type="button" onClick={() => onAdd(day)}><Plus />添加安排</button>
          </section>
        ))}
      </div>
    </section>
  )
}
