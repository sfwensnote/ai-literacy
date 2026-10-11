'use client'

import { useEffect, useState } from 'react'
import type { TripSubmission as Submission } from '../../../features/assessment/types'
import { CheckOption } from './shared'

const defaults = {
  saturday: '09:00 上海出发（高铁）\n11:00 抵达杭州，办理入住\n14:00 西湖慢游与拍照\n18:00 河坊街与杭帮菜\n20:30 返回酒店',
  sunday: '08:30 酒店出发\n09:00 灵隐寺游览\n12:00 周边午餐\n14:00 购买伴手礼\n18:00 返回上海',
}
const checklistOptions = ['充电宝', '雨具', '身份证', '舒适鞋']

export function TripSubmission({ initial, onDraftChange, onSubmit }: { initial?: Partial<Submission>; onDraftChange: (value: Record<string, unknown>) => void; onSubmit: (value: Submission) => void }) {
  const [saturday, setSaturday] = useState(initial?.saturday ?? defaults.saturday)
  const [sunday, setSunday] = useState(initial?.sunday ?? defaults.sunday)
  const [checklist, setChecklist] = useState(initial?.checklist ?? checklistOptions)
  const [adjustment, setAdjustment] = useState(initial?.adjustment ?? '周六下午放慢节奏，减少换乘')
  useEffect(() => onDraftChange({ saturday, sunday, checklist, adjustment }), [adjustment, checklist, onDraftChange, saturday, sunday])
  const toggle = (item: string, checked: boolean) => setChecklist((items) => checked ? [...new Set([...items, item])] : items.filter((value) => value !== item))
  return (
    <section className="submission-card trip-submission">
      <h2>我的最终安排</h2>
      <div className="trip-columns">
        <label>周六<textarea aria-label="周六行程" value={saturday} onChange={(event) => setSaturday(event.target.value)} /></label>
        <label>周日<textarea aria-label="周日行程" value={sunday} onChange={(event) => setSunday(event.target.value)} /></label>
        <fieldset><legend>准备清单</legend>{checklistOptions.map((item) => <CheckOption key={item} checked={checklist.includes(item)} onChange={(checked) => toggle(item, checked)}>{item}</CheckOption>)}</fieldset>
      </div>
      <label className="inline-field">我想调整的一点<input value={adjustment} onChange={(event) => setAdjustment(event.target.value)} /></label>
      <button className="submit-button" type="button" disabled={!saturday.trim() || !sunday.trim()} onClick={() => onSubmit({ saturday, sunday, checklist, adjustment })}>提交我的安排 <span>→</span></button>
    </section>
  )
}
