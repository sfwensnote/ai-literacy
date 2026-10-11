'use client'

import { useEffect, useState } from 'react'
import type { InternshipSubmission as Submission } from '../../../features/assessment/types'
import { CheckOption, RadioOption } from './shared'

const infoOptions = [
  ['major', '专业和研究方向'], ['skills', '已掌握技能'], ['time', '可投入时间'], ['real_name', '真实姓名'], ['phone', '手机号'], ['student_id', '学号'], ['id_card', '身份证号'],
]

function DotRating({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <fieldset className="dot-rating"><legend>{label}</legend><div>{[1,2,3,4,5].map((score) => <button key={score} aria-label={`${label} ${score} 分`} type="button" className={score <= value ? 'filled' : ''} onClick={() => onChange(score)} />)}</div></fieldset>
}

export function InternshipSubmission({ initial, onDraftChange, onSubmit }: { initial?: Partial<Submission>; onDraftChange: (value: Record<string, unknown>) => void; onSubmit: (value: Submission) => void }) {
  const [sharedInfo, setSharedInfo] = useState(initial?.sharedInfo ?? ['major', 'skills', 'time'])
  const [ratings, setRatings] = useState(initial?.ratings ?? { match: 4, growth: 4, pressure: 3 })
  const [priorities, setPriorities] = useState(initial?.priorities ?? ['方向匹配', '时间可控'])
  const [decision, setDecision] = useState<Submission['decision']>(initial?.decision ?? 'learn_more')
  const [reason, setReason] = useState(initial?.reason ?? '方向比较匹配，但我想先确认实际项目内容和每周投入时间。')
  useEffect(() => onDraftChange({ sharedInfo, ratings, priorities, decision, reason }), [decision, onDraftChange, priorities, ratings, reason, sharedInfo])
  const toggleInfo = (key: string, checked: boolean) => setSharedInfo((items) => checked ? [...new Set([...items, key])] : items.filter((item) => item !== key))
  const togglePriority = (key: string) => setPriorities((items) => items.includes(key) ? items.filter((item) => item !== key) : items.length < 2 ? [...items, key] : [items[1], key])
  return (
    <section className="submission-card internship-submission">
      <details><summary>提供给 AI 的信息</summary><div className="option-grid privacy-options">{infoOptions.map(([key, label]) => <CheckOption key={key} checked={sharedInfo.includes(key)} onChange={(checked) => toggleInfo(key, checked)}>{label}</CheckOption>)}</div></details>
      <h2>我的决定</h2>
      <div className="ratings"><DotRating label="岗位匹配" value={ratings.match} onChange={(match) => setRatings({ ...ratings, match })} /><DotRating label="成长收获" value={ratings.growth} onChange={(growth) => setRatings({ ...ratings, growth })} /><DotRating label="时间压力" value={ratings.pressure} onChange={(pressure) => setRatings({ ...ratings, pressure })} /></div>
      <div className="priority-row"><strong>我最看重的两点</strong>{['方向匹配','时间可控','成长空间','团队支持'].map((item) => <button type="button" key={item} onClick={() => togglePriority(item)} className={priorities.includes(item) ? 'selected' : ''}>{item}</button>)}</div>
      <fieldset><legend>最终选择</legend><div className="decision-row"><RadioOption checked={decision === 'apply'} onChange={() => setDecision('apply')}>准备投递</RadioOption><RadioOption checked={decision === 'learn_more'} onChange={() => setDecision('learn_more')}>再了解一下</RadioOption><RadioOption checked={decision === 'skip'} onChange={() => setDecision('skip')}>暂不投递</RadioOption></div></fieldset>
      <label className="inline-field">我的理由<input aria-label="我的理由" value={reason} onChange={(event) => setReason(event.target.value)} /></label>
      <button className="submit-button" type="button" onClick={() => onSubmit({ sharedInfo, ratings, priorities, decision, reason })}>提交我的判断 <span>→</span></button>
    </section>
  )
}
