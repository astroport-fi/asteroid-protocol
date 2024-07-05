import { Alert } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

export function InscribingNotSupportedWithLedger({
  className,
}: {
  className?: string
}) {
  return (
    <Alert
      className={twMerge(
        'flex max-w- justify-center border border-warning text-center mb-12',
        className,
      )}
    >
      Inscribing is not supported when using Ledger
    </Alert>
  )
}
