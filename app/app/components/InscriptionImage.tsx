import { EyeSlashIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { getMimeTitle } from '~/utils/string'

const SMALL_IMAGE_THRESHOLD = 200

export default function InscriptionImage({
  isExplicit,
  src,
  mime,
  className,
  min,
}: {
  isExplicit?: boolean
  className?: string
  src: string
  mime?: string
  min?: boolean
}) {
  const mimeTitle = getMimeTitle(mime ?? 'image/png')
  const [smallImage, setSmallImage] = useState(false)
  const noImageClass = clsx(
    'flex flex-col items-center justify-center w-full h-full uppercase',
    { 'bg-base-200 px-8 py-16': !min },
  )

  if (isExplicit) {
    return (
      <span className={twMerge(noImageClass, className)}>
        <EyeSlashIcon className="size-6" />
        {!min && <span className="mt-2 text-center">Explicit content</span>}
      </span>
    )
  }

  if (mimeTitle === 'Image') {
    return (
      <img
        src={src}
        alt=""
        className={clsx(twMerge('w-full h-full object-cover', className), {
          'image-pixelated': smallImage,
        })}
        onLoad={(e) => {
          if (e.currentTarget.naturalHeight < SMALL_IMAGE_THRESHOLD) {
            setSmallImage(true)
          }
        }}
      />
    )
  }

  if (mimeTitle === 'Video') {
    return (
      <video
        className={twMerge('w-full h-full object-cover', className)}
        controls
      >
        <source src={src} type={mime} />
        Video not supported by browser
      </video>
    )
  }

  return <span className={twMerge(noImageClass, className)}>{mimeTitle}</span>
}
