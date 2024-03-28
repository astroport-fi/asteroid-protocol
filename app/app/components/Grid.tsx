import clsx from 'clsx'
import { PropsWithChildren } from 'react'

export default function Grid({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={clsx('grid grid-cols-fill-56 gap-4', className)}>
      {children}
    </div>
  )
}
