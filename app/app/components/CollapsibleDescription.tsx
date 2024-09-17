import clsx from 'clsx'
import { PropsWithChildren, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export default function CollapsibleDescription({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const [collapsed, isCollapsed] = useState(true)

  return (
    <p
      className={twMerge(
        clsx(
          'transition-all overflow-hidden ease-in-out delay-50 duration-500 whitespace-pre-wrap text-ellipsis cursor-pointer max-h-[100rem]',
          className,
          {
            'max-h-24 line-clamp-4': collapsed,
          },
        ),
      )}
      onClick={() => isCollapsed(!collapsed)}
      role="presentation"
    >
      {children}
    </p>
  )
}
