import { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

export default function GhostEmptyState({
  children,
  className,
  text,
}: PropsWithChildren<{ text?: string; className?: string }>) {
  if (!text) {
    text = "it's a bit empty here..."
  }
  return (
    <div className={twMerge('flex flex-col items-center', className)}>
      <span>{text}</span>
      {children}
    </div>
  )
}
