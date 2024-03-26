import { EyeSlashIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { Skeleton } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { getMimeTitle } from '~/utils/string'
import LazyImage from './LazyImage'

const SMALL_IMAGE_THRESHOLD = 200

export default function InscriptionImage({
  isExplicit,
  src,
  mime,
  className,
  containerClassName,
  imageClassName,
  min,
}: {
  isExplicit?: boolean
  className?: string
  containerClassName?: string
  imageClassName?: string
  src: string
  mime?: string
  min?: boolean
}) {
  const mimeTitle = getMimeTitle(mime ?? 'image/png')
  const [smallImage, setSmallImage] = useState(false)
  const generalClass = 'group-hover:scale-125 transition duration-500'
  const noImageClass = clsx(
    twMerge(
      'flex flex-col items-center justify-center w-full h-full uppercase',
      imageClassName,
    ),
    { 'bg-base-200 px-8 py-16': !min },
  )

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
      <LazyImage
        placeholder={
          <Skeleton
            className={twMerge('w-full h-full rounded-none', imageClassName)}
          />
        }
        onLoad={(e) => {
          if (
            !smallImage &&
            e.currentTarget.naturalHeight < SMALL_IMAGE_THRESHOLD
          ) {
            setSmallImage(true)
          }
        }}
        imageClassName={clsx(
          twMerge('object-cover w-full h-full', imageClassName),
          {
            'image-pixelated': smallImage,
          },
        )}
        containerClassName={twMerge(generalClass, className)}
        src={src}
      ></LazyImage>
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
