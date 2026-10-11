import { BriefcaseBusiness, FileText, FolderOpen, Headphones, UserRound } from 'lucide-react'
import type { SceneConfig } from '../../features/assessment/scene-config'

const icons = { product: Headphones, user: UserRound, document: FileText, folder: FolderOpen, briefcase: BriefcaseBusiness }

export function MaterialCard({ section }: { section: SceneConfig['sections'][number] }) {
  const Icon = icons[section.icon]
  return (
    <section className="material-card">
      <div className="material-heading"><span className="material-icon"><Icon size={25} /></span><h2>{section.title}</h2></div>
      <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
      {section.note && <p>{section.note}</p>}
    </section>
  )
}
