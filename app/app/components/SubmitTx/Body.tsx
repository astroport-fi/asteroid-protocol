import { StdFee } from '@cosmjs/stargate'
import { PropsWithChildren } from 'react'
import { MetaprotocolFee, SubmitTxError, TxState } from '~/hooks/useSubmitTx'
import { EstimateError, SignError } from './Errors'
import { FeeBreakdown } from './FeeBreakdown'
import TxStatus from './TxStatus'

interface BodyProps {
  chainFee: StdFee | null
  metaprotocolFee: MetaprotocolFee
  error: SubmitTxError | null
  txHash: string | null
  txState: TxState
  resultCTA: string
  feeOperationTitle?: string
  onCTAClick?: () => void
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
  onCTAClick,
}: PropsWithChildren<BodyProps>) {
  if (txHash) {
    return (
      <TxStatus
        txHash={txHash}
        txState={txState}
        txError={error}
        resultCTA={resultCTA}
        onCTAClick={onCTAClick}
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
