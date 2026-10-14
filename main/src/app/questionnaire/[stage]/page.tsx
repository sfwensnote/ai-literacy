import { notFound } from 'next/navigation'
import { QuestionnaireClient } from '../../../components/questionnaire/questionnaire-client'

export default async function QuestionnairePage({ params }: { params: Promise<{ stage: string }> }) {
  const { stage } = await params
  if (stage !== 'pre' && stage !== 'post') notFound()
  return <QuestionnaireClient stage={stage} />
}
