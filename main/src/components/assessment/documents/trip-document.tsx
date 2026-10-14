'use client'
import type { ItineraryItem, TaskTwoDraft } from '../../../features/assessment/types'
import {
  changedItineraryIds,
  itineraryToText,
  moveItineraryItem,
} from '../../../features/assessment/task-flow'
import { CitedSources, type TaskDocumentProps } from '../task-document-shared'
import { ItineraryEditor } from '../itinerary-editor'
import { ItineraryView } from '../itinerary-view'
export function TripDocument({
  draft,
  updateDraft,
  recordEvent,
  submit,
  onAskAI,
}: TaskDocumentProps) {
  const d = draft as unknown as TaskTwoDraft
  const items = d.itinerary
  const choose = (action: 'accept' | 'edit' | 'ask_ai') => {
    updateDraft({
      initialAction: d.initialAction ?? action,
      phase: action === 'accept' ? 'confirm' : action === 'edit' ? 'editing' : 'initial',
    })
    recordEvent('task2_initial_action', { initial_action: action })
    if (action === 'accept') recordEvent('task2_direct_accept', { direct_accept: true })
    if (action === 'ask_ai') onAskAI()
  }
  const edit = (type: string, after: ItineraryItem[], extra: Record<string, unknown> = {}) => {
    updateDraft({ itinerary: after, changedItemIds: changedItineraryIds(items, after) })
    recordEvent(type, { before_itinerary: items, after_itinerary: after, ...extra })
  }
  return (
    <div className="desktop-task-document">
      <p className="desktop-requirement-line">
        周六出发，周日晚回 · 2 人约 1200 元 · 西湖、灵隐寺、河坊街 · 少换乘
      </p>
      {d.phase === 'editing' ? (
        <ItineraryEditor
          items={items}
          onEdit={(itemId, patch) =>
            edit(
              'task2_edit_item',
              items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
              { itemId },
            )
          }
          onDelete={(itemId) =>
            edit(
              'task2_delete_item',
              items.filter((item) => item.id !== itemId),
              { itemId },
            )
          }
          onMove={(itemId, direction) =>
            edit('task2_reorder_item', moveItineraryItem(items, itemId, direction), {
              itemId,
              direction,
            })
          }
          onAdd={(day) => {
            const item: ItineraryItem = {
              id: crypto.randomUUID(),
              day,
              period: '下午',
              title: '新增安排',
              detail: '点击文字继续修改。',
            }
            edit('task2_add_item', [...items, item], { item })
          }}
        />
      ) : (
        <ItineraryView items={items} changedItemIds={d.changedItemIds} />
      )}
      <CitedSources draft={draft} />
      {d.phase === 'confirm' ? (
        <section className="desktop-message-preview">
          <h2>确认当前行程</h2>
          <p>把这份最终方案发给社团，继续下一项任务。</p>
          <div className="desktop-document-actions">
            <button className="desktop-secondary" onClick={() => updateDraft({ phase: 'editing' })}>
              继续修改
            </button>
            <button
              className="desktop-primary"
              onClick={() => {
                recordEvent('task2_submit', {
                  final_itinerary: items,
                  initial_action: d.initialAction,
                })
                submit({
                  saturday: itineraryToText(items, 'saturday'),
                  sunday: itineraryToText(items, 'sunday'),
                  checklist: [],
                  adjustment: d.initialAction === 'accept' ? '' : '已根据实际需求调整当前行程',
                  itinerary: items,
                  initialAction: d.initialAction,
                })
              }}
            >
              确认并继续
            </button>
          </div>
        </section>
      ) : (
        <div className="desktop-document-actions">
          <button className="desktop-secondary" onClick={() => choose('edit')}>
            {d.phase === 'editing' ? '继续编辑' : '我想改一改'}
          </button>
          <button className="desktop-secondary" onClick={() => choose('ask_ai')}>
            问问 AI
          </button>
          <button
            className="desktop-primary"
            onClick={() => {
              if (d.phase === 'editing') updateDraft({ phase: 'confirm' })
              else choose('accept')
            }}
          >
            {d.phase === 'editing'
              ? '保存并继续'
              : d.initialAction
                ? '完成我的行程'
                : '就这样，可以'}
          </button>
        </div>
      )}
    </div>
  )
}
