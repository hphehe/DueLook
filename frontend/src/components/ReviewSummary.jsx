import { formatDate } from '../utils'

const REVIEW_COPY = {
  LOW_CONFIDENCE: {
    title: 'Check this result',
    body: 'DueLook is not certain this email was classified correctly.',
  },
  MISSING_DATE: {
    title: 'Deadline missing',
    body: 'This email appears to require action, but no specific date was found.',
  },
  VAGUE_TIME: {
    title: 'Time needs clarification',
    body: 'The email uses a vague time that needs your review.',
  },
  MULTIPLE_DATES: {
    title: 'Multiple dates found',
    body: 'Choose the date that applies to the required action.',
  },
  ACTION_UNCLEAR: {
    title: 'Action unclear',
    body: 'Review whether this email requires you to take action.',
  },
  AI_UNAVAILABLE: {
    title: 'Analysis needs review',
    body: 'DueLook could not reliably analyze this email.',
  },
}

export default function ReviewSummary({ email }) {
  const copy = REVIEW_COPY[email.review_reason] ?? REVIEW_COPY.LOW_CONFIDENCE
  const suggestion = email.ai_deadline
    ? `Suggested deadline: ${formatDate(email.ai_deadline)}`
    : email.ai_tab === 'NO_DEADLINE'
      ? 'Suggestion: No deadline'
      : null

  return (
    <section className="review-summary" aria-label="AI review needed">
      <div className="review-summary-title">{copy.title}</div>
      <div className="review-summary-body">{copy.body}</div>
      {suggestion && <div className="review-summary-suggestion">{suggestion}</div>}
    </section>
  )
}
