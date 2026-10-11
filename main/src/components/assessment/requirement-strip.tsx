import type { LucideIcon } from 'lucide-react'

export interface RequirementItem {
  icon: LucideIcon
  title: string
  detail?: string
}

export function RequirementStrip({ title, items }: { title: string; items: RequirementItem[] }) {
  return (
    <section className="requirement-strip">
      <h2>{title}</h2>
      <div className="requirement-items">
        {items.map(({ icon: Icon, title: itemTitle, detail }) => (
          <div className="requirement-item" key={itemTitle}>
            <Icon aria-hidden="true" />
            <span><strong>{itemTitle}</strong>{detail && <small>{detail}</small>}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
