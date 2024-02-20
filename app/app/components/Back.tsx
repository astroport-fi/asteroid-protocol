import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { PropsWithChildren } from 'react'

export function BackButton({ to }: { to: string }) {
  return (
    <Link className="btn btn-ghost btn-circle" to={to}>
      <ArrowLeftIcon className="size-5" />
    </Link>
  )
}

export function BackHeader({
  to,
  children,
}: PropsWithChildren<{ to: string }>) {
  return (
    <div className="flex flex-row">
      <BackButton to={to} />
      {children}
    </div>
  )
}
