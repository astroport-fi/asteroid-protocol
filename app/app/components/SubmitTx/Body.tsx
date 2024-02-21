import { PropsWithChildren } from 'react'
import { TxState } from '~/hooks/useSubmitTx'
import { EstimateError, SignError } from './Errors'
import { FeeBreakdown } from './FeeBreakdown'
import TxStatus from './TxStatus'

interface BodyProps {
  chainFee: number
  error: string | null
  txHash: string | null
  txState: TxState
  resultCTA?: string
  onClose?: () => void
}

export default function Body({
  error,
  chainFee,
  txHash,
  txState,
  resultCTA,
  children,
  onClose,
}: PropsWithChildren<BodyProps>) {
  if (error) {
    if (chainFee) {
      return <SignError />
    }
    return <EstimateError error={error} />
  }

  if (txHash) {
    return (
      <TxStatus
        txHash={txHash}
        txState={txState}
        txError={error}
        resultCTA={resultCTA}
        onClose={onClose}
      />
    )
  }

  return (
    <div>
      {children}
      <FeeBreakdown chainFee={chainFee} />
    </div>
  )
}
