import { PropsWithChildren } from 'react'
import ghostAnimationData from '~/lottie/ghost.json'
import Lottie from './Lottie'

export default function GhostEmptyState({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col items-center">
      <Lottie animationData={ghostAnimationData} />
      <span>it&apos;s a bit empty here...</span>
      {children}
    </div>
  )
}
