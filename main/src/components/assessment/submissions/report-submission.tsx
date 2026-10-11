'use client'

import { useEffect, useState } from 'react'
import type { ReportSubmission as Submission } from '../../../features/assessment/types'
import { CheckOption } from './shared'

const defaultBody = '在线教育为大学生提供了更灵活的学习方式，尤其在资源获取与时间安排方面具有明显优势。它也可能提升部分学生的自主学习能力。另一方面，线上环境可能削弱即时互动，部分学生在自我管理和学习动机方面面临挑战。因此，在线教育既带来新的机会，也存在不能忽视的问题。高校可在课程目标、学生支持与质量评估充分的前提下，审慎发展适合线上开展的课程，并用可核验研究持续评估其效果。'

export function ReportSubmission({ initial, onDraftChange, onSubmit }: { initial?: Partial<Submission>; onDraftChange: (value: Record<string, unknown>) => void; onSubmit: (value: Submission) => void }) {
  const [title, setTitle] = useState(initial?.title ?? '在线教育对大学生学习的影响')
  const [body, setBody] = useState(initial?.body ?? defaultBody)
  const [keepItems, setKeepItems] = useState(initial?.keepItems ?? ['multi_angle', 'balanced', 'real_sources'])
  const [modifyItems, setModifyItems] = useState(initial?.modifyItems ?? ['remove_unknown', 'cautious_conclusion'])
  useEffect(() => onDraftChange({ title, body, keepItems, modifyItems }), [body, keepItems, modifyItems, onDraftChange, title])
  const toggle = (setter: typeof setKeepItems, items: string[], key: string, checked: boolean) => setter(checked ? [...new Set([...items, key])] : items.filter((item) => item !== key))
  return (
    <section className="submission-card report-submission">
      <h2>我的最终稿</h2>
      <label className="inline-field">标题<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="field-label" htmlFor="report-body">正文（节选）</label>
      <textarea id="report-body" className="report-body" value={body} onChange={(event) => setBody(event.target.value)} />
      <div className="report-options">
        <fieldset><legend>我保留的内容</legend>
          <CheckOption checked={keepItems.includes('multi_angle')} onChange={(c) => toggle(setKeepItems, keepItems, 'multi_angle', c)}>多角度分析</CheckOption>
          <CheckOption checked={keepItems.includes('balanced')} onChange={(c) => toggle(setKeepItems, keepItems, 'balanced', c)}>保留积极与消极影响</CheckOption>
          <CheckOption checked={keepItems.includes('real_sources')} onChange={(c) => toggle(setKeepItems, keepItems, 'real_sources', c)}>补充真实来源</CheckOption>
        </fieldset>
        <fieldset><legend>我准备修改的地方</legend>
          <CheckOption checked={modifyItems.includes('remove_unknown')} onChange={(c) => toggle(setModifyItems, modifyItems, 'remove_unknown', c)}>删除来源不明的数据</CheckOption>
          <CheckOption checked={modifyItems.includes('cautious_conclusion')} onChange={(c) => toggle(setModifyItems, modifyItems, 'cautious_conclusion', c)}>把结论写得更谨慎</CheckOption>
        </fieldset>
      </div>
      <button className="submit-button" type="button" disabled={!title.trim() || body.trim().length < 80} onClick={() => onSubmit({ title, body, keepItems, modifyItems })}>提交我的报告 <span>→</span></button>
    </section>
  )
}
