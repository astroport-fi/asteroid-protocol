import { twMerge } from 'tailwind-merge'

export default function Twitter({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={twMerge('fill-current size-6', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.3,3.8l46.3,61.9L0,116.2h10.5l40.8-44.1l33,44.1H120L71.1,50.7l43.4-46.9H104L66.4,44.5L36,3.8
      H0.3z M15.7,11.6h16.4l72.4,96.9H88.2L15.7,11.6z"
      />
    </svg>
  )
}
