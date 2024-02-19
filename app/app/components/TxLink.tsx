import { Link } from 'react-daisyui'
import { useRootContext } from '~/context/root'

export default function TxLink({
  txHash,
  title,
}: {
  txHash: string
  title?: string
}) {
  const { txExplorer } = useRootContext()
  return (
    <Link
      href={`${txExplorer}${txHash}`}
      target="_blank"
      rel="noreferrer"
      color="primary"
    >
      {title ?? txHash}
    </Link>
  )
}
