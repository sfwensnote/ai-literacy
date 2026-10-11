import { notFound } from 'next/navigation'
import { FeedbackClient } from '../../../components/feedback/feedback-client'

export default async function DimensionPage({ params }: { params: Promise<{ page: string }> }) {
  const { page: raw } = await params
  const page = Number(raw)
  if (!Number.isInteger(page) || page < 1 || page > 4) notFound()
  return <FeedbackClient page={page} />
}
