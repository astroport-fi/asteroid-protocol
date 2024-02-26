import { LottieOptions, useLottie } from 'lottie-react'

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
    width: 250,
    height: 250,
  }

  const { View } = useLottie(options)
  return <div className={className ?? 'size-64'}>{View}</div>
}
