'use client'
import type { HeadphoneSubmission, TaskOneDraft } from '../../../features/assessment/types'
import { toggleClaimSelection } from '../../../features/assessment/task-flow'
import { headphoneClaims, purchaseDecisions } from '../../../features/assessment/workspace-config'
import { CitedSources, citationsFrom, type TaskDocumentProps } from '../task-document-shared'
export function PurchaseDocument({
  draft,
  messages,
  updateDraft,
  recordEvent,
  submit,
  onAskAI,
}: TaskDocumentProps) {
  const d = draft as unknown as TaskOneDraft
  const final = d.phase === 'final_decision'
  const citations = citationsFrom(draft)
  const choose = (decision: HeadphoneSubmission['decision']) => {
    updateDraft({ decision })
    recordEvent('task1_final_decision', { decision })
  }
  return (
    <div className="desktop-task-document purchase">
      <p className="desktop-requirement-line">预算约 900 元 · 通勤与运动 · 降噪好、佩戴舒适</p>
      {!final ? (
        <>
          <section className="desktop-document-section">
            <h2>采购建议</h2>
            <div className="desktop-advice">
              {headphoneClaims.map((claim, index) => (
                <span key={claim.id}>
                  <button
                    className={d.selectedClaims.includes(claim.id) ? 'selected' : ''}
                    aria-pressed={d.selectedClaims.includes(claim.id)}
                    onClick={() => {
                      const selectedClaims = toggleClaimSelection(d.selectedClaims, claim.id)
                      updateDraft({ selectedClaims, trustAll: false })
                      recordEvent(
                        selectedClaims.includes(claim.id)
                          ? 'task1_claim_select'
                          : 'task1_claim_unselect',
                        { claimId: claim.id, claimText: claim.text },
                      )
                    }}
                  >
                    {claim.text}
                  </button>
                  {index < headphoneClaims.length - 1 ? '，' : '。'}
                </span>
              ))}
            </div>
          </section>
          <section className="desktop-document-section">
            <h2>标记要核查的内容</h2>
            <p>直接点击建议中的句子，可多选。</p>
            {d.selectedClaims.length > 0 && (
              <div className="desktop-selected-claims">
                {d.selectedClaims.map((id) => (
                  <span key={id}>{headphoneClaims.find((item) => item.id === id)?.text}</span>
                ))}
              </div>
            )}
            <label className="desktop-check">
              <input
                type="checkbox"
                checked={d.trustAll}
                onChange={(event) => {
                  updateDraft({
                    trustAll: event.target.checked,
                    selectedClaims: event.target.checked ? [] : d.selectedClaims,
                  })
                  recordEvent('task1_trust_all', { value: event.target.checked })
                }}
              />
              我认为这段建议整体都比较可信
            </label>
          </section>
        </>
      ) : (
        <>
          <section className="desktop-document-section">
            <h2>你的判断依据</h2>
            <p>
              {d.selectedClaims.length
                ? d.selectedClaims
                    .map((id) => headphoneClaims.find((item) => item.id === id)?.text)
                    .join('；')
                : '没有标记待核查的句子。'}
            </p>
            {messages.some((message) => message.role === 'assistant') && (
              <div className="desktop-ai-summary">
                <h3>AI 补充信息</h3>
                <p>{messages.filter((message) => message.role === 'assistant').at(-1)?.content}</p>
              </div>
            )}
          </section>
        </>
      )}
      <fieldset className="desktop-choice-group">
        <legend>你的采购建议</legend>
        <div>
          {purchaseDecisions.map((option) => (
            <label className={d.decision === option.value ? 'selected' : ''} key={option.value}>
              <input
                type="radio"
                name="purchase-decision"
                checked={d.decision === option.value}
                onChange={() => choose(option.value)}
              />
              {option.title}
            </label>
          ))}
        </div>
      </fieldset>
      {final && (
        <>
          <label className="desktop-field">
            判断理由
            <textarea
              aria-label="判断理由"
              value={d.reason}
              maxLength={500}
              onChange={(event) => updateDraft({ reason: event.target.value })}
              placeholder="结合来源和证据，说明你的判断。"
            />
          </label>
          <CitedSources draft={draft} />
          {!citations.length && (
            <label className="desktop-check">
              <input
                type="checkbox"
                checked={Boolean(draft.noSources)}
                onChange={(event) => {
                  updateDraft({ noSources: event.target.checked })
                  recordEvent('task1_no_sources', { value: event.target.checked })
                }}
              />
              暂未找到可引用来源
            </label>
          )}
          <section className="desktop-message-preview">
            <h2>发给社长的消息</h2>
            <p>
              <b>
                {purchaseDecisions.find((item) => item.value === d.decision)?.title ?? '尚未选择'}
              </b>
            </p>
            <p>{d.reason || '补充你的判断理由。'}</p>
            <span>{citations.length} 条来源证据</span>
          </section>
        </>
      )}
      <div className="desktop-document-actions">
        <button className="desktop-secondary" onClick={onAskAI}>
          问问 AI
        </button>
        <button
          className="desktop-primary"
          disabled={
            !d.decision || (final && (!d.reason.trim() || (!citations.length && !draft.noSources)))
          }
          onClick={() => {
            if (!d.decision) return
            if (!final) {
              updateDraft({
                phase: 'final_decision',
                initialSelectedClaims: d.initialSelectedClaims?.length
                  ? d.initialSelectedClaims
                  : d.selectedClaims,
              })
              return
            }
            recordEvent('task1_submit', {
              final_decision: d.decision,
              final_reason: d.reason,
              citations,
              initial_selected_claims: d.initialSelectedClaims,
              final_selected_claims: d.selectedClaims,
            })
            submit({
              decision: d.decision,
              reason: d.reason.trim(),
              verifyItems: d.selectedClaims,
              citations,
            })
          }}
        >
          {final ? '提交并继续' : '下一步'}
        </button>
      </div>
    </div>
  )
}
