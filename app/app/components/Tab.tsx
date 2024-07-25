import { Link } from '@remix-run/react'
import clsx from 'clsx'
import { PropsWithChildren } from 'react'

export default function Tab({
  active,
  to,
  children,
}: PropsWithChildren<{ active?: boolean; to: string }>) {
  const classes = clsx('tab', {
    'tab-active': active,
  })
  return (
    <Link role="tab" className={classes} to={to}>
      {children}
    </Link>
  )
}
