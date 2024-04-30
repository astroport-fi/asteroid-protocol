import { LottieOptions, useLottie } from 'lottie-react'
import { clientOnly$ } from 'vite-env-only'

export default function Lottie({
  animationData,
  className,
  loop = true,
}: {
  animationData: LottieOptions['animationData']
  className?: string
  loop?: boolean
}) {
  const options = {
    animationData,
    loop,
  }

  const lottie = clientOnly$(useLottie(options))
  return (
    <div className={className ?? 'size-48 lg:size-64'}>
      {lottie ? lottie.View : <div />}
    </div>
  )
}
