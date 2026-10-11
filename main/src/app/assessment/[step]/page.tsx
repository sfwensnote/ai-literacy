import { notFound } from 'next/navigation'
import { AssessmentClient } from '../../../components/assessment/assessment-client'

export default async function AssessmentPage({ params }: { params: Promise<{ step: string }> }) {
  const { step: rawStep } = await params
  const step = Number(rawStep)
  if (!Number.isInteger(step) || step < 1 || step > 4) notFound()
  return <AssessmentClient step={step} />
}
