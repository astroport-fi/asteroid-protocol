import { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

export default function Stat({
  title,
  children,
  className,
}: PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <div
      className={twMerge(
        'flex flex-col items-center md:flex-row justify-center w-full bg-base-200 p-2 rounded-xl',
        className,
      )}
    >
      <strong>{title}</strong>
      <span className="ml-2">{children}</span>
    </div>
  )
}
