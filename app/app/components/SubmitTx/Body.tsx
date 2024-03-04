import { PropsWithChildren } from 'react'
import { MetaprotocolFee, SubmitTxError, TxState } from '~/hooks/useSubmitTx'
import { EstimateError, SignError } from './Errors'
import { FeeBreakdown } from './FeeBreakdown'
import TxStatus from './TxStatus'

interface BodyProps {
  chainFee: number
  metaprotocolFee: MetaprotocolFee
  error: SubmitTxError | null
  txHash: string | null
  txState: TxState
  resultCTA?: string
  feeOperationTitle?: string
  onClose?: () => void
}

export default function Body({
  error,
  chainFee,
  metaprotocolFee,
  txHash,
  txState,
  resultCTA,
  feeOperationTitle,
  children,
  onClose,
}: PropsWithChildren<BodyProps>) {
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

  if (error) {
    if (chainFee) {
      return <SignError />
    }
    return <EstimateError error={error} />
  }

  return (
    <div className="flex flex-col items-center">
      {children}
      <FeeBreakdown
        chainFee={chainFee}
        metaprotocolFee={metaprotocolFee}
        operationTitle={feeOperationTitle}
      />
    </div>
  )
}
