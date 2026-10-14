'use client'
import type {
  ReportDocument as ReportValue,
  TaskThreeDraft,
} from '../../../features/assessment/types'
import {
  reportKeepOptions,
  reportModifyOptions,
} from '../../../features/assessment/workspace-config'
import { CitedSources, type TaskDocumentProps } from '../task-document-shared'
import { ReportDocument } from '../report-document'
export function ReportMaterial({
  draft,
  updateDraft,
  recordEvent,
  submit,
  onAskAI,
}: TaskDocumentProps) {
  const d = draft as unknown as TaskThreeDraft
  const editing = d.phase === 'editing' || d.phase === 'confirm'
  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
  return (
    <div className="desktop-task-document">
      <p className="desktop-requirement-line">
        约 800 字 · 包含不同观点 · 有资料来源 · 语言清晰正式
      </p>
      <ReportDocument
        report={d.report}
        editing={editing}
        selectedClaims={d.selectedClaims}
        changedClaimIds={d.changedClaimIds}
        onToggleClaim={(claimId) => {
          const selectedClaims = toggle(d.selectedClaims, claimId)
          updateDraft({ selectedClaims })
          recordEvent(
            selectedClaims.includes(claimId) ? 'task3_claim_select' : 'task3_claim_unselect',
            { claimId },
          )
        }}
        onChange={(report: ReportValue) => {
          updateDraft({ report })
          recordEvent('task3_report_edit', { report })
        }}
      />
      {!editing && (
        <label className="desktop-check">
          <input
            type="checkbox"
            checked={Boolean(d.trustAll)}
            onChange={(event) => {
              updateDraft({
                trustAll: event.target.checked,
                selectedClaims: event.target.checked ? [] : d.selectedClaims,
              })
              recordEvent('task3_trust_all', { value: event.target.checked })
            }}
          />
          我认为这份初稿可以直接使用
        </label>
      )}
      {d.phase === 'confirm' && (
        <div className="desktop-report-options">
          <fieldset>
            <legend>我保留的内容</legend>
            {reportKeepOptions.map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={d.keepItems.includes(key)}
                  onChange={() => updateDraft({ keepItems: toggle(d.keepItems, key) })}
                />
                {label}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>我准备修改的地方</legend>
            {reportModifyOptions.map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={d.modifyItems.includes(key)}
                  onChange={() => updateDraft({ modifyItems: toggle(d.modifyItems, key) })}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
      )}
      <CitedSources draft={draft} />
      <div className="desktop-document-actions">
        <button className="desktop-secondary" onClick={onAskAI}>
          问问 AI
        </button>
        <button className="desktop-secondary" onClick={() => updateDraft({ phase: 'editing' })}>
          {d.phase === 'confirm' ? '继续修改' : '编辑报告'}
        </button>
        <button
          className="desktop-primary"
          disabled={editing && (!d.report.title.trim() || d.report.body.trim().length < 80)}
          onClick={() => {
            if (d.phase !== 'confirm') {
              updateDraft({ phase: 'confirm' })
              return
            }
            recordEvent('task3_submit', {
              final_report: d.report,
              selected_claims: d.selectedClaims,
              keep_items: d.keepItems,
              modify_items: d.modifyItems,
            })
            submit({ ...d.report, keepItems: d.keepItems, modifyItems: d.modifyItems })
          }}
        >
          {d.phase === 'confirm'
            ? '提交我的报告'
            : d.phase === 'editing'
              ? '保存并继续'
              : '进入最终稿'}
        </button>
      </div>
    </div>
  )
}
