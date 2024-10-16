import { PropsWithChildren } from 'react'

export default function GhostEmptyState({
  children,
  text,
}: PropsWithChildren<{ text?: string }>) {
  if (!text) {
    text = "it's a bit empty here..."
  }
  return (
    <div className="flex flex-col items-center">
      <span>{text}</span>
      {children}
    </div>
  )
}
