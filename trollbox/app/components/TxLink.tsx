import { Link } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { useRootContext } from '~/context/root'

export default function TxLink({
  txHash,
  title,
  className,
}: {
  txHash: string
  title?: string
  className?: string
}) {
  const { txExplorer } = useRootContext()
  return (
    <Link
      href={`${txExplorer}${txHash}`}
      target="_blank"
      color="secondary"
      className={twMerge('overflow-hidden text-ellipsis', className)}
    >
      {title ?? txHash}
    </Link>
  )
}
