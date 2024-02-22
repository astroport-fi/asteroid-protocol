import { EyeSlashIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import { getMimeTitle } from '~/utils/string'

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
  mime: string
  min?: boolean
}) {
  const mimeTitle = getMimeTitle(mime)
  const noImageClass = clsx(
    'flex items-center justify-center w-full h-full uppercase',
    { ['bg-base-200 p-16']: !min },
  )

  if (isExplicit) {
    return (
      <span className={twMerge(noImageClass, className)}>
        <EyeSlashIcon className="size-6" />
        {!min && <span className="ml-2">Explicit content</span>}
      </span>
    )
  }

  if (mimeTitle === 'Image') {
    return (
      <img
        src={src}
        alt=""
        className={twMerge('w-full h-full object-cover', className)}
      />
    )
  }

  return <span className={twMerge(noImageClass, className)}>{mimeTitle}</span>
}
