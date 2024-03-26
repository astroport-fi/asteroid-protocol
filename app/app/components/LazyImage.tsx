import clsx from 'clsx'
import { useCallback, useState } from 'react'
import { InView } from 'react-intersection-observer'
import { twMerge } from 'tailwind-merge'

type ImgProps = React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>

declare type Props = {
  imageClassName?: string
  containerClassName?: string
  placeholder: React.ReactNode
  src: ImgProps['src']
  onLoad?: ImgProps['onLoad']
}

export default function LazyImage({
  placeholder,
  onLoad,
  src,
  containerClassName,
  imageClassName,
}: Props) {
  const [loaded, setLoaded] = useState(false)
  const handleVisible = useCallback(() => setLoaded(true), [])

  return (
    <InView triggerOnce>
      {({ inView, ref }) => (
        <div
          ref={ref}
          className={twMerge(
            clsx({ 'w-full h-full': !loaded }),
            containerClassName,
          )}
        >
          {!loaded && placeholder}
          {inView && (
            <img
              src={src}
              alt=""
              className={clsx(imageClassName, { hidden: !loaded })}
              onLoad={(e) => {
                handleVisible()
                onLoad?.(e)
              }}
              onError={handleVisible}
            />
          )}
        </div>
      )}
    </InView>
  )
}
