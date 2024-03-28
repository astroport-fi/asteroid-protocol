import { round2 } from '~/utils/math'

export default function PercentageText({ value }: { value: number }) {
  return `${round2(value * 100)}%`
}
