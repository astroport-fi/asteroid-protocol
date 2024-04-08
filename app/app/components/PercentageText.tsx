import { twMerge } from 'tailwind-merge'
import { round2 } from '~/utils/math'

export default function PercentageText({ value }: { value: number }) {
  return `${round2(value * 100)}%`
}

export function PercentageTextColored({ value }: { value: number }) {
  const className = value < 0 ? 'text-error' : 'text-success'
  return (
    <span
      className={twMerge('font-mono', className)}
    >{`${round2(value * 100)}%`}</span>
  )
}
