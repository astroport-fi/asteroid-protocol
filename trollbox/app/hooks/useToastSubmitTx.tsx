import { TxInscription } from '@asteroid-protocol/sdk'
import { useEffect, useRef } from 'react'
import { Id, toast } from 'react-toastify'
import { ErrorToast, TxLinkToast } from '~/components/tx/Toast'
import useSubmitTx, { TxState } from '~/hooks/useSubmitTx'

export default function useToastSubmitTx(
  txInscription: TxInscription | null,
  {
    onSuccess,
    successMessage,
  }: { onSuccess?: () => void; successMessage?: string } = {},
) {
  const toastId = useRef<Id | null>(null)

  const {
    metaprotocolFee,
    error,
    txState,
    txHash,
    sendTx,
    resetState,
    client,
  } = useSubmitTx(txInscription)

  useEffect(() => {
    if (!toastId.current) {
      return
    }

    if (txState === TxState.Success) {
      toast.update(toastId.current, {
        type: 'success',
        autoClose: 5000,
        icon: () => '🧌',
        isLoading: false,
        render: (
          <TxLinkToast
            text={successMessage ?? 'Transaction complete'}
            txHash={txHash}
          />
        ),
      })
      resetState()
      onSuccess?.()
      return
    }

    if (txState === TxState.Failed) {
      toast.update(toastId.current, {
        type: 'error',
        autoClose: 5000,
        isLoading: false,
        render: `Transaction failed: ${error?.message}`,
      })
      resetState()
      return
    }

    if (
      txState == TxState.SuccessOnchain ||
      txState == TxState.SuccessIndexer
    ) {
      toast.update(toastId.current, {
        isLoading: true,
        render: (
          <TxLinkToast
            text="Waiting for transaction to be indexed"
            txHash={txHash}
          />
        ),
      })
      return
    }

    if (txState == TxState.Submit) {
      toast.update(toastId.current, {
        isLoading: true,
        render:
          'Your transaction has been submitted and waiting to be added to the next block',
      })
      return
    }

    if (txState == TxState.Sign && error) {
      toast.update(toastId.current, {
        type: 'error',
        autoClose: 5000,
        isLoading: false,
        render: <ErrorToast error={error} />,
      })
      resetState()
      return
    }

    if (error) {
      toast.update(toastId.current, {
        type: 'error',
        autoClose: 5000,
        isLoading: false,
        render: <ErrorToast error={error} />,
      })
      resetState()
      return
    }
  }, [txState, txHash, error, resetState, onSuccess, successMessage])

  return {
    sendTx: () => {
      toastId.current = toast('Sign and submit transaction', {
        autoClose: false,
        isLoading: true,
      })
      sendTx()
    },
    metaprotocolFee,
    client,
    toastId,
  }
}
