import { EyeSlashIcon } from '@heroicons/react/24/solid'
import { twMerge } from 'tailwind-merge'
import { getMimeTitle } from '~/utils/string'

export default function InscriptionImage({
  isExplicit,
  src,
  mime,
  className,
}: {
  isExplicit?: boolean
  className?: string
  src: string
  mime: string
}) {
  const mimeTitle = getMimeTitle(mime)

  if (isExplicit) {
    return (
      <span
        className={twMerge(
          'flex items-center justify-center w-full h-full bg-base-200 uppercase',
          className,
        )}
      >
        <EyeSlashIcon className="size-6" />
        <span className="ml-2">Explicit content</span>
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

  return (
    <span
      className={twMerge(
        'flex items-center justify-center w-full h-full bg-base-200 uppercase',
        className,
      )}
    >
      {mimeTitle}
    </span>
  )
}
