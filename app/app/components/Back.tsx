import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import { Link } from '@remix-run/react'
import { PropsWithChildren } from 'react'

export function BackButton({ to }: { to: string }) {
  return (
    <Link className="btn btn-ghost btn-circle mr-1" to={to}>
      <ArrowLeftIcon className="size-5" />
    </Link>
  )
}

export function BackHeader({
  to,
  children,
}: PropsWithChildren<{ to: string }>) {
  return (
    <div className="flex flex-row items-center">
      <BackButton to={to} />
      <div className="flex items-center text-lg font-medium">{children}</div>
    </div>
  )
}
