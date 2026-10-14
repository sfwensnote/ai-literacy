import type {
  ChatMessage,
  SceneId,
  SceneSubmission,
  SourceCitation,
} from '../../features/assessment/types'
import { validateCitation } from '../../features/assessment/browser-sources'
export interface TaskDocumentProps {
  sceneId: SceneId
  draft: Record<string, unknown>
  messages: ChatMessage[]
  updateDraft: (patch: Record<string, unknown>) => void
  recordEvent: (type: string, payload?: Record<string, unknown>) => void
  submit: (submission: SceneSubmission) => void
  onAskAI: () => void
}
export function citationsFrom(draft: Record<string, unknown>): SourceCitation[] {
  return Array.isArray(draft.citations)
    ? (draft.citations as SourceCitation[]).filter(validateCitation)
    : []
}
export function CitedSources({ draft }: { draft: Record<string, unknown> }) {
  const citations = citationsFrom(draft)
  if (!citations.length) return null
  return (
    <section className="desktop-submission-sources">
      <h2>引用来源</h2>
      {citations.map((item) => (
        <article key={item.url + item.excerpt}>
          <span className="desktop-source-url">{item.url}</span>
          <blockquote>{item.excerpt}</blockquote>
        </article>
      ))}
    </section>
  )
}
