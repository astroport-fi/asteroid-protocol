import { PropsWithChildren } from 'react'
import ghostAnimationData from '~/lottie/ghost.json'
import Lottie from './Lottie'

export default function GhostEmptyState({
  children,
  text,
}: PropsWithChildren<{ text?: string }>) {
  if (!text) {
    text = "it's a bit empty here..."
  }
  return (
    <div className="flex flex-col items-center">
      <Lottie animationData={ghostAnimationData} />
      <span>{text}</span>
      {children}
    </div>
  )
}
