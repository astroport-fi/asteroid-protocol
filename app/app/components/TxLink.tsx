import { Link } from 'react-daisyui'
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
      color="primary"
      className={className}
    >
      {title ?? txHash}
    </Link>
  )
}
