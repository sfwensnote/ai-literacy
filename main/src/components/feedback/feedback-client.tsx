'use client'

import { BarChart3, Lightbulb, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { dimensionOrder, sceneOrder, type Dimension } from '../../features/assessment/types'
import { useAssessmentStore } from '../../features/assessment/session-store'
import { getAllowedRoute } from '../../features/assessment/session-guards'
import {
  attitudeDomains,
  summarizeQuestionnaire,
  type AttitudeDomain,
} from '../../features/assessment/questionnaire'
import { validateCitation } from '../../features/assessment/browser-sources'
import { generateFeedback } from '../../features/scoring/feedback-generator'
import { FeedbackNav } from './feedback-nav'
import { RadarChart } from './radar-chart'

export function FeedbackClient({ page }: { page: number }) {
  const router = useRouter()
  const session = useAssessmentStore((state) => state.session)
  const hydrated = useAssessmentStore((state) => state.hydrated)
  useEffect(() => {
    if (!hydrated) return
    if (!session) router.replace('/')
    else if (getAllowedRoute(session) !== '/feedback') router.replace(getAllowedRoute(session))
  }, [hydrated, router, session])
  const model = useMemo(
    () => (session?.scores ? generateFeedback(session, session.evidence, session.scores) : null),
    [session],
  )
  if (!session?.scores || !model || getAllowedRoute(session) !== '/feedback')
    return <main className="feedback-loading">正在读取反馈…</main>

  if (page === 0) {
    return (
      <main className="feedback-page">
        <FeedbackNav page={0} />
        <div className="feedback-overview">
          <section className="overview-score">
            <div>
              <h1>测评反馈</h1>
              <p>基于四个情境任务，生成你的整体画像与建议</p>
            </div>
            <div className="score-panel">
              <h2>综合表现</h2>
              <strong>
                {model.total}
                <small>/ 100</small>
              </strong>
              <p>
                <BarChart3 size={25} />
                {model.overallSummary}
              </p>
            </div>
          </section>
          <RadarChart scores={session.scores} />
          <section className="portrait-panel">
            <h2>
              <UserRound />
              你的行为证据
            </h2>
            {session.evidence
              .filter((item) => item.status === 'positive')
              .slice(0, 3)
              .map((item) => (
                <p key={item.id}>{item.description}</p>
              ))}
          </section>
        </div>
        <div className="dimension-grid">
          {dimensionOrder.map((dimension, index) => {
            const detail = model.dimensions[dimension]
            return (
              <article key={dimension}>
                <h2>{detail.name}</h2>
                <strong>
                  {detail.score}
                  <small>/100</small>
                </strong>
                <span className={`level-label ${detail.level.band}`}>{detail.level.label}</span>
                <p>{detail.level.description}</p>
                <Link href={`/feedback/${index + 1}`}>查看详情 →</Link>
              </article>
            )
          })}
          <article className="overall-advice">
            <h2>
              <Lightbulb />
              总体建议
            </h2>
            {model.overallSuggestions.map((item, index) => (
              <p key={item}>
                <b>{index + 1}</b>
                {item}
              </p>
            ))}
          </article>
        </div>
        <AttitudeReport />
      </main>
    )
  }

  const dimension = dimensionOrder[page - 1] as Dimension
  const detail = model.dimensions[dimension]
  return (
    <main className="feedback-page">
      <FeedbackNav page={page} />
      <div className="dimension-layout">
        <aside className="dimension-summary">
          <h1>{detail.name}</h1>
          <span className={`level-label ${detail.level.band}`}>{detail.level.label}</span>
          <div className="big-score">
            <span>本维度得分</span>
            <strong>
              {detail.score}
              <small>/100</small>
            </strong>
          </div>
          <div className="scene-link">
            <b>对应场景</b>
            <span>{detail.scene}</span>
          </div>
        </aside>
        <section className="feedback-center">
          <article>
            <h2>行为反馈</h2>
            {detail.feedback.map((item) => (
              <div className="evidence-row" key={item}>
                <span>✓</span>
                <p>{item}</p>
              </div>
            ))}
          </article>
          <article className="level-description">
            <h2>你现在大概在哪一档</h2>
            <dl>
              <div>
                <dt>任务复杂度</dt>
                <dd>{detail.level.complexity}</dd>
              </div>
              <div>
                <dt>自主性</dt>
                <dd>{detail.level.autonomy}</dd>
              </div>
            </dl>
            <p>{detail.level.description}</p>
            <p className="report-method-note">
              项目参考档位：低于 65 为低阶，65–79 为中阶，80 及以上为高阶；尚未作实证标定。
            </p>
          </article>
        </section>
        <aside className="feedback-side">
          <article>
            <h2>
              <Lightbulb />
              提升建议
            </h2>
            {detail.suggestions.map((item, index) => (
              <div className="suggestion" key={item}>
                <b>{index + 1}</b>
                <p>{item}</p>
              </div>
            ))}
          </article>
          <article>
            <h2>
              <UserRound />
              你在任务中的表现
            </h2>
            <ul>
              {detail.behaviors.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </aside>
      </div>
    </main>
  )
}

function AttitudeReport() {
  const session = useAssessmentStore((state) => state.session)!
  const updateDraft = useAssessmentStore((state) => state.updateDraft)
  const recordEvent = useAssessmentStore((state) => state.recordEvent)
  const before = summarizeQuestionnaire(session.questionnaires?.pre)
  const after = summarizeQuestionnaire(session.questionnaires?.post)
  const citations = sceneOrder
    .flatMap((id) => session.scenes[id].finalSubmission?.citations ?? [])
    .filter(validateCitation)
  const [saved, setSaved] = useState(false)
  const reflection = String(session.scenes.internship.draft.reflection ?? '')
  return (
    <section className="dual-evidence-report">
      <div className="attitude-report">
        <h2>我的态度变化</h2>
        <p>前后测单独呈现；不计入行为分数，也不将变化解释为能力提升。</p>
        <table>
          <caption>9 题研究用草案 · 1–5 分均值</caption>
          <thead>
            <tr>
              <th scope="col">情意维度</th>
              <th scope="col">开始前</th>
              <th scope="col">完成后</th>
              <th scope="col">变化</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(attitudeDomains).map(([key, label]) => {
              const domain = key as AttitudeDomain
              const pre = before[domain],
                post = after[domain]
              const delta =
                pre !== null && post !== null ? Math.round((post - pre) * 100) / 100 : null
              return (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  <td>{pre?.toFixed(2) ?? '未完成'}</td>
                  <td>{post?.toFixed(2) ?? '未完成'}</td>
                  <td>{delta === null ? '—' : (delta > 0 ? '+' : '') + delta.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="report-method-note">
          开放思维与 AI
          态度越高，表示越愿意探索和参与；误信易感性越高，表示越容易相信未经核实的信息。题库包含反向题。
        </p>
      </div>
      <div className="report-source-list">
        <h2>我提交的来源证据</h2>
        {citations.length ? (
          citations.map((item) => (
            <article key={item.url + item.excerpt}>
              <span>{item.url}</span>
              <p>{item.excerpt}</p>
            </article>
          ))
        ) : (
          <p>本次没有提交来源引用。</p>
        )}
      </div>
      <div className="report-reflection">
        <h2>给下次的自己</h2>
        <label>
          下一次使用 AI，我会做的一项改变
          <textarea
            value={reflection}
            maxLength={500}
            onChange={(event) => {
              updateDraft('internship', { reflection: event.target.value })
              setSaved(false)
            }}
          />
        </label>
        <div>
          <button
            className="task-secondary"
            disabled={!reflection.trim()}
            onClick={() => {
              recordEvent('internship', 'reflection_saved', { reflection: reflection.trim() })
              setSaved(true)
            }}
          >
            保存反思
          </button>
          <span role="status">{saved ? '已保存' : ''}</span>
        </div>
      </div>
      <div className="report-export">
        <p>行为分数与等级为项目规则结果；问卷为自陈证据，均用于研究演示。</p>
        <button
          className="task-secondary"
          onClick={() => {
            const blob = new Blob(
              [
                JSON.stringify(
                  {
                    instrumentVersion: 'club-desktop-v3',
                    session,
                    attitudeSummary: { pre: before, post: after },
                  },
                  null,
                  2,
                ),
              ],
              { type: 'application/json' },
            )
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `ai-literacy-${session.id}.json`
            link.click()
            URL.revokeObjectURL(url)
          }}
        >
          下载我的测评记录
        </button>
      </div>
    </section>
  )
}
