import type { Color } from '../storage/types'

/** Small dot that indicates which side the opening is for. */
export function ColorDot({ color, className = '' }: { color: Color; className?: string }) {
  const cls =
    color === 'white'
      ? 'bg-white ring-1 ring-neutral-400 dark:ring-neutral-500'
      : 'bg-neutral-900 dark:bg-neutral-950 ring-1 ring-neutral-700'
  return (
    <span
      aria-label={`Play as ${color}`}
      title={`Play as ${color}`}
      className={`inline-block h-2.5 w-2.5 rounded-full ${cls} ${className}`}
    />
  )
}
