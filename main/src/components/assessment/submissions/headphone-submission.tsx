'use client'

import { useEffect, useState } from 'react'
import type { HeadphoneSubmission as Submission } from '../../../features/assessment/types'
import { CheckOption, RadioOption } from './shared'

const verifyOptions = [
  ['battery', '续航约 30 小时'], ['ranking', '同价位降噪排名第一'], ['satisfaction', '95% 用户满意'], ['other', '其他'],
]
const decisions: Array<[Submission['decision'], string]> = [['adopt', '我会采纳'], ['more_info', '我还需要更多信息'], ['reject', '我不采纳']]

export function HeadphoneSubmission({ initial, onDraftChange, onSubmit }: { initial?: Partial<Submission>; onDraftChange: (value: Record<string, unknown>) => void; onSubmit: (value: Submission) => void }) {
  const [verifyItems, setVerifyItems] = useState<string[]>(initial?.verifyItems ?? ['ranking', 'satisfaction'])
  const [decision, setDecision] = useState<Submission['decision']>(initial?.decision ?? 'more_info')
  const [reason, setReason] = useState(initial?.reason ?? '')
  useEffect(() => onDraftChange({ verifyItems, decision, reason }), [decision, onDraftChange, reason, verifyItems])
  const toggle = (key: string, checked: boolean) => setVerifyItems((items) => checked ? [...new Set([...items, key])] : items.filter((item) => item !== key))
  return (
    <section className="submission-card">
      <h2>做出你的判断</h2>
      <fieldset><legend>哪些内容还需要进一步核验？</legend><div className="option-grid">{verifyOptions.map(([key, label]) => <CheckOption key={key} checked={verifyItems.includes(key)} onChange={(checked) => toggle(key, checked)}>{label}</CheckOption>)}</div></fieldset>
      <fieldset><legend>你的决定</legend><div className="decision-row">{decisions.map(([key, label]) => <RadioOption key={key} checked={decision === key} onChange={() => setDecision(key)}>{label}</RadioOption>)}</div></fieldset>
      <label className="field-label" htmlFor="headphone-reason">简单说明原因（可选）</label>
      <textarea id="headphone-reason" value={reason} maxLength={200} onChange={(event) => setReason(event.target.value)} placeholder="例如：部分结论缺少可核验来源…" />
      <button className="submit-button" type="button" onClick={() => onSubmit({ verifyItems, decision, reason })}>提交并继续 <span>→</span></button>
    </section>
  )
}
