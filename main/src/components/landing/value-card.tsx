import type { LucideIcon } from 'lucide-react'

interface ValueCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function ValueCard({ icon: Icon, title, description }: ValueCardProps) {
  return (
    <article className="value-card">
      <span className="value-icon"><Icon size={31} strokeWidth={1.8} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  )
}
