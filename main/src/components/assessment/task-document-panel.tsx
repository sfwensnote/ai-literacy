import { initialWorkspaceDraft } from '../../features/assessment/workspace-config'
import type { TaskDocumentProps } from './task-document-shared'
import { PurchaseDocument } from './documents/purchase-document'
import { TripDocument } from './documents/trip-document'
import { ReportMaterial } from './documents/report-material'
import { InternshipDocument } from './documents/internship-document'

export function TaskDocumentPanel(props: TaskDocumentProps) {
  const draft = { ...initialWorkspaceDraft(props.sceneId), ...props.draft }
  const effective = { ...props, draft }
  switch (props.sceneId) {
    case 'headphones':
      return <PurchaseDocument {...effective} />
    case 'trip':
      return <TripDocument {...effective} />
    case 'report':
      return <ReportMaterial {...effective} />
    case 'internship':
      return <InternshipDocument {...effective} />
  }
}
