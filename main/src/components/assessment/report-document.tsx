'use client'

import type { ReportDocument as ReportValue } from '../../features/assessment/types'

const claimPatterns: Array<{ id: string; pattern: RegExp }> = [
  { id: 'unsupported_view', pattern: /^一些研究认为它能增强学习自主性$/ },
  { id: 'sample_reference', pattern: /^Johnson 等（2021）指出在线教育显著提高了大学生的整体成绩$/ },
  { id: 'strong_conclusion', pattern: /^因此高校应全面扩大在线课程$/ },
]

const splitPattern = /(一些研究认为它能增强学习自主性|Johnson 等（2021）指出在线教育显著提高了大学生的整体成绩|因此高校应全面扩大在线课程)/g

function claimIdFor(text: string) {
  return claimPatterns.find(({ pattern }) => pattern.test(text))?.id
}

export function ReportDocument({ report, editing = false, selectedClaims = [], changedClaimIds = [], onToggleClaim, onChange }: {
  report: ReportValue
  editing?: boolean
  selectedClaims?: string[]
  changedClaimIds?: string[]
  onToggleClaim?: (claimId: string) => void
  onChange?: (report: ReportValue) => void
}) {
  return (
    <section className="report-document-card">
      <h2>当前报告</h2>
      {editing ? (
        <div className="report-edit-fields">
          <label>标题<input aria-label="报告标题" value={report.title} onChange={(event) => onChange?.({ ...report, title: event.target.value })} /></label>
          <label>正文<textarea aria-label="报告正文" value={report.body} onChange={(event) => onChange?.({ ...report, body: event.target.value })} /></label>
        </div>
      ) : (
        <article className="report-paper">
          <h3>{report.title}</h3>
          <p>{report.body.split(splitPattern).map((part, index) => {
            const claimId = claimIdFor(part)
            if (!claimId) return <span key={`${part}-${index}`}>{part}</span>
            return <button
              type="button"
              key={claimId}
              aria-pressed={selectedClaims.includes(claimId)}
              className={`${selectedClaims.includes(claimId) ? 'selected' : ''} ${changedClaimIds.includes(claimId) ? 'recently-changed' : ''}`}
              onClick={() => onToggleClaim?.(claimId)}
            >{part}</button>
          })}</p>
        </article>
      )}
    </section>
  )
}
