import { StdFee } from '@cosmjs/stargate'
import { PropsWithChildren } from 'react'
import {
  ErrorKind,
  MetaprotocolFee,
  SubmitTxError,
  TxState,
} from '~/hooks/useSubmitTx'
import { SignError, TxError } from './Errors'
import { InscriptionFeeBreakdown, TxFeeBreakdown } from './FeeBreakdown'
import { InscriptionTxStatus, TxStatus } from './TxStatus'

interface TxBodyProps {
  chainFee: StdFee | null
  error: SubmitTxError | null
  txHash: string | null
  txState: TxState
}

interface InscriptionBodyProps extends TxBodyProps {
  metaprotocolFee: MetaprotocolFee
  resultCTA?: string
  feeOperationTitle?: string
  onCTAClick?: () => void
}

export function InscriptionBody({
  error,
  chainFee,
  metaprotocolFee,
  txHash,
  txState,
  resultCTA,
  feeOperationTitle,
  children,
  onCTAClick,
}: PropsWithChildren<InscriptionBodyProps>) {
  if (txHash) {
    return (
      <InscriptionTxStatus
        txHash={txHash}
        txState={txState}
        txError={error}
        resultCTA={resultCTA}
        onCTAClick={onCTAClick}
      />
    )
  }

  if (error) {
    if (
      chainFee &&
      error.kind === ErrorKind.Transaction &&
      error.message.includes('Request rejected')
    ) {
      return <SignError />
    }
    return <TxError error={error} />
  }

  return (
    <div className="flex flex-col items-center">
      {children}
      <InscriptionFeeBreakdown
        chainFee={chainFee}
        metaprotocolFee={metaprotocolFee}
        operationTitle={feeOperationTitle}
      />
    </div>
  )
}

export function TxBody({
  error,
  chainFee,
  txHash,
  txState,
  children,
}: PropsWithChildren<TxBodyProps>) {
  if (txHash) {
    return <TxStatus txHash={txHash} txState={txState} txError={error} />
  }

  if (error) {
    if (
      chainFee &&
      error.kind === ErrorKind.Transaction &&
      error.message.includes('Request rejected')
    ) {
      return <SignError />
    }
    return <TxError error={error} />
  }

  return (
    <div className="flex flex-col items-center">
      {children}
      <TxFeeBreakdown chainFee={chainFee} />
    </div>
  )
}
