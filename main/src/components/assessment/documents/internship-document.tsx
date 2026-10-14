'use client'
import type { InternshipSubmission, TaskFourDraft } from '../../../features/assessment/types'
import { toggleLimitedSelection } from '../../../features/assessment/task-flow'
import { internshipDecisions, shareOptions } from '../../../features/assessment/workspace-config'
import { CitedSources, type TaskDocumentProps } from '../task-document-shared'
import { InternshipAnalysis } from '../internship-analysis'
export function InternshipDocument({
  draft,
  updateDraft,
  recordEvent,
  submit,
  onAskAI,
}: TaskDocumentProps) {
  const d = draft as unknown as TaskFourDraft
  const phase = d.phase
  const toggleInfo = (key: string) => {
    const sharedInfo = d.sharedInfo.includes(key)
      ? d.sharedInfo.filter((item) => item !== key)
      : [...d.sharedInfo, key]
    updateDraft({ sharedInfo })
    recordEvent('task4_shared_info_change', { key, shared_info: sharedInfo })
  }
  return (
    <div className="desktop-task-document">
      <p className="desktop-requirement-line">
        算法实习生 · 云启科技 · 3 个月可远程 · Python / 机器学习基础
      </p>
      {phase !== 'decision' && phase !== 'confirm' ? (
        <>
          <section className="desktop-document-section">
            <h2>我的情况</h2>
            <p>当前研一，正在学习机器学习，希望积累大模型项目经验；本学期课程较多、时间有限。</p>
          </section>
          <fieldset className="desktop-sharing">
            <legend>提供给 AI 的信息</legend>
            <div>
              {shareOptions.map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={d.sharedInfo.includes(key)}
                    onChange={() => toggleInfo(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <InternshipAnalysis />
        </>
      ) : phase === 'decision' ? (
        <>
          <InternshipAnalysis compact />
          <section className="desktop-ratings">
            <h2>我的判断</h2>
            <div>
              {(
                [
                  ['match', '岗位匹配'],
                  ['growth', '成长收获'],
                  ['pressure', '时间压力'],
                ] as const
              ).map(([key, label]) => (
                <fieldset key={key}>
                  <legend>{label}</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        className={d.ratings[key] === value ? 'selected' : ''}
                        aria-pressed={d.ratings[key] === value}
                        aria-label={label + ' ' + value + ' 分'}
                        key={value}
                        onClick={() => {
                          const ratings = { ...d.ratings, [key]: value }
                          updateDraft({ ratings })
                          recordEvent('task4_rating_change', { key, value, ratings })
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
          <section className="desktop-priorities">
            <h2>我最看重的两点</h2>
            <div>
              {['方向匹配', '时间可控', '成长空间', '团队支持'].map((priority) => (
                <button
                  key={priority}
                  className={d.priorities.includes(priority) ? 'selected' : ''}
                  onClick={() => {
                    const priorities = toggleLimitedSelection(d.priorities, priority, 2)
                    updateDraft({ priorities })
                    recordEvent('task4_priority_change', { priority, priorities })
                  }}
                >
                  {priority}
                </button>
              ))}
            </div>
          </section>
          <fieldset className="desktop-choice-group">
            <legend>最终选择</legend>
            <div>
              {internshipDecisions.map((option) => (
                <label className={d.decision === option.value ? 'selected' : ''} key={option.value}>
                  <input
                    type="radio"
                    name="internship-decision"
                    checked={d.decision === option.value}
                    onChange={() => {
                      updateDraft({ decision: option.value })
                      recordEvent('task4_decision_change', { decision: option.value })
                    }}
                  />
                  {option.title}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="desktop-field">
            我的理由（可选）
            <input
              aria-label="我的理由"
              value={d.reason}
              onChange={(event) => updateDraft({ reason: event.target.value })}
            />
          </label>
        </>
      ) : (
        <section className="desktop-message-preview">
          <h2>我的最终决定</h2>
          <p>
            <strong>
              {internshipDecisions.find((option) => option.value === d.decision)?.title}
            </strong>
          </p>
          <p>{d.reason.trim() || '暂未补充理由'}</p>
          <p>
            岗位匹配 {d.ratings.match}/5 · 成长收获 {d.ratings.growth}/5 · 时间压力{' '}
            {d.ratings.pressure}/5
          </p>
          <p>{d.priorities.join('、')}</p>
        </section>
      )}
      <CitedSources draft={draft} />
      <div className="desktop-document-actions">
        <button className="desktop-secondary" onClick={onAskAI}>
          问问 AI
        </button>
        {phase === 'confirm' && (
          <button className="desktop-secondary" onClick={() => updateDraft({ phase: 'decision' })}>
            返回修改
          </button>
        )}
        <button
          className="desktop-primary"
          disabled={(phase === 'decision' || phase === 'confirm') && !d.decision}
          onClick={() => {
            if (phase !== 'decision' && phase !== 'confirm') {
              updateDraft({ phase: 'decision' })
              return
            }
            if (phase === 'decision') {
              updateDraft({ phase: 'confirm' })
              return
            }
            if (!d.decision) return
            const submission: InternshipSubmission = {
              sharedInfo: d.sharedInfo,
              ratings: d.ratings,
              priorities: d.priorities,
              decision: d.decision,
              reason: d.reason,
            }
            recordEvent('task4_submit', { submission })
            submit(submission)
          }}
        >
          {phase === 'confirm'
            ? '提交我的判断'
            : phase === 'decision'
              ? '确认我的选择'
              : '形成我的判断'}
        </button>
      </div>
    </div>
  )
}
