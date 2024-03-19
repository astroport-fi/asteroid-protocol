import { EyeSlashIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { getMimeTitle } from '~/utils/string'

const SMALL_IMAGE_THRESHOLD = 200

export default function InscriptionImage({
  isExplicit,
  src,
  mime,
  className,
  containerClassName,
  min,
}: {
  isExplicit?: boolean
  className?: string
  containerClassName?: string
  src: string
  mime?: string
  min?: boolean
}) {
  const mimeTitle = getMimeTitle(mime ?? 'image/png')
  const [smallImage, setSmallImage] = useState(false)
  const generalClass = 'group-hover:scale-125 transition duration-500'
  const noImageClass = clsx(
    'flex flex-col items-center justify-center w-full h-full uppercase',
    { 'bg-base-200 px-8 py-16': !min },
  )
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    if (!smallImage && ref.current?.complete) {
      if (ref.current.naturalHeight < SMALL_IMAGE_THRESHOLD) {
        setSmallImage(true)
      }
    }
  }, [smallImage])

  let imageComponent: JSX.Element

  if (isExplicit) {
    imageComponent = (
      <span className={twMerge(noImageClass, generalClass, className)}>
        <EyeSlashIcon className="size-6" />
        {!min && <span className="mt-2 text-center">Explicit content</span>}
      </span>
    )
  } else if (mimeTitle === 'Image') {
    imageComponent = (
      <img
        src={src}
        ref={ref}
        alt=""
        className={clsx(
          twMerge('w-full h-full object-cover', generalClass, className),
          {
            'image-pixelated': smallImage,
          },
        )}
        onLoad={(e) => {
          if (
            !smallImage &&
            e.currentTarget.naturalHeight < SMALL_IMAGE_THRESHOLD
          ) {
            setSmallImage(true)
          }
        }}
      />
    )
  } else if (mimeTitle === 'Video') {
    imageComponent = (
      <video
        className={twMerge(
          'w-full h-full object-cover',
          generalClass,
          className,
        )}
        controls
      >
        <source src={src} type={mime} />
        Video not supported by browser
      </video>
    )
  } else {
    imageComponent = (
      <span className={twMerge(noImageClass, generalClass, className)}>
        {mimeTitle}
      </span>
    )
  }

  if (containerClassName) {
    return (
      <div
        className={twMerge('overflow-hidden rounded-t-xl', containerClassName)}
      >
        {imageComponent}
      </div>
    )
  }

  return imageComponent
}
