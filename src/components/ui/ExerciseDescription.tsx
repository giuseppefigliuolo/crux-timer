import type { MouseEvent } from 'react'

/**
 * Renders exercise copy; a trailing "Ref: domain/path" (as in program JSON) becomes a real https link.
 */
function refToHref(raw: string): string {
  const t = raw.trim()
  if (/^https?:\/\//i.test(t)) return t
  if (t.startsWith('//')) return `https:${t}`
  return `https://${t}`
}

export function parseExerciseDescription(text: string): {
  body: string
  refUrl: string | null
} {
  const spaced = text.match(/\sRef:\s+(.+)$/)
  if (spaced) {
    return {
      body: text.slice(0, spaced.index).trimEnd(),
      refUrl: spaced[1].trim()
    }
  }
  const only = text.match(/^Ref:\s+(.+)$/)
  if (only) {
    return { body: '', refUrl: only[1].trim() }
  }
  return { body: text, refUrl: null }
}

interface ExerciseDescriptionProps {
  text: string
  className?: string
  /** Use when the description sits inside a clickable parent (e.g. exercise card) */
  linkStopPropagation?: boolean
}

export default function ExerciseDescription({
  text,
  className,
  linkStopPropagation
}: ExerciseDescriptionProps) {
  const { body, refUrl } = parseExerciseDescription(text)

  if (!refUrl) {
    return <span className={className}>{text}</span>
  }

  const href = refToHref(refUrl)
  const onLinkClick = linkStopPropagation
    ? (e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation()
    : undefined

  return (
    <span className={className}>
      {body}
      {body ? ' ' : null}
      Ref:{' '}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onLinkClick}
        className="text-primary font-medium underline underline-offset-2 decoration-primary/50 hover:decoration-primary break-all"
      >
        {refUrl}
      </a>
    </span>
  )
}
