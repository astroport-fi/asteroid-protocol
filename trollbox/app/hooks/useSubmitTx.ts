import { TxInscription, prepareTx } from '@asteroid-protocol/sdk'
import { StdFee } from '@cosmjs/stargate'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { clientOnly$ } from 'vite-env-only'
import { AsteroidClient } from '~/api/client'
import { useRootContext } from '~/context/root'
import useAsteroidClient from '~/hooks/api/useAsteroidClient'
import useCosmosClient, { SigningClient } from '~/hooks/useCosmosClient'
import useAddress from '~/hooks/wallet/useAddress'

export enum TxState {
  Initial,
  Submit,
  Sign,
  SuccessOnchain, // intermediate state used for inscription transactions only
  SuccessIndexer, // intermediate state used for inscription transactions only
  Success,
  Failed,
}

interface CheckResult {
  status: TxState
  error?: string
}

async function checkTransaction(
  client: SigningClient,
  asteroidClient: AsteroidClient,
  txState: TxState,
  txHash: string,
): Promise<CheckResult | undefined> {
  if (txState == TxState.Submit) {
    const tx = await client.getTx(txHash)
    if (tx) {
      if (tx.code) {
        return {
          status: TxState.Failed,
          error: `Transaction failed with error code ${tx.code}`,
        }
      }
      return { status: TxState.SuccessOnchain }
    }
  } else {
    // Transaction was found on chain, now check indexer
    const transactionStatus = await asteroidClient.getTransactionStatus(txHash)

    if (transactionStatus) {
      // Indexer has it, keep checking until statusMessage changes
      // to something else than pending
      if (transactionStatus.toLowerCase() == 'success') {
        return { status: TxState.Success }
      } else if (transactionStatus.toLowerCase().includes('error')) {
        // We hit an error
        return { status: TxState.Failed, error: transactionStatus }
      } else {
        return { status: TxState.SuccessIndexer }
      }
    }
  }
}

export interface MetaprotocolFee {
  base: number
  operation: number
}

export enum ErrorKind {
  Generic,
  Estimation,
  Validation,
  Transaction,
}

export interface SubmitTxError {
  message: string
  kind: ErrorKind
}

export default function useSubmitTx(txInscription: TxInscription | null) {
  const [retryCounter, setRetryCounter] = useState(0)
  const { useIbc } = useRootContext()

  // deps
  const clientState = clientOnly$(useCosmosClient(retryCounter))
  const asteroidClient = useAsteroidClient()
  const address = useAddress()

  // state
  const [txState, setTxState] = useState<TxState>(TxState.Initial)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState<SubmitTxError | null>(null)
  const [chainFee, setChainFee] = useState<StdFee | null>(null)

  const txData = useMemo(() => {
    if (!address || !txInscription) {
      return null
    }

    return clientOnly$(
      prepareTx(address, txInscription.urn, [txInscription], {
        useIbc,
        useExtensionData: true,
      }),
    )
  }, [txInscription, address, useIbc])

  const metaprotocolFee = useMemo<MetaprotocolFee>(() => {
    if (!txInscription) {
      return {
        base: 0,
        operation: 0,
      }
    }

    const operationFee =
      txInscription.messages?.reduce((acc, msg) => {
        msg.typeUrl
        if (msg.typeUrl === '/cosmos.bank.v1beta1.MsgSend') {
          const value = msg.value as MsgSend
          acc += parseInt(value.amount[0].amount)
        }
        return acc
      }, 0) ?? 0

    return {
      base: parseInt(txInscription.fee.operation),
      operation: operationFee,
    }
  }, [txInscription])

  // Estimate chain fee
  useEffect(() => {
    if (!txData || !clientState || clientState.isLoading) {
      return
    }

    if (clientState.error || !clientState.client) {
      const errMsg = clientState.error?.message
      setError({
        kind: ErrorKind.Estimation,
        message: `There is no client to estimate chain fee${errMsg ? `: ${errMsg}` : ''}`,
      })
      return
    }

    clientState.client
      .estimate(txData)
      .then((res) => {
        setChainFee(res)
        setError(null)
      })
      .catch((err) => {
        setError({
          kind: ErrorKind.Estimation,
          message: (err as Error).message,
        })
      })
  }, [txData, clientState, retryCounter])

  // Send transaction
  const sendTx = useCallback(async () => {
    if (!address) {
      setError({
        message: 'no address, connect wallet first',
        kind: ErrorKind.Generic,
      })
      return
    }

    if (!clientState || !clientState.client) {
      setError({ message: 'invalid client', kind: ErrorKind.Generic })
      return
    }

    if (!txData) {
      setError({ message: 'invalid txData', kind: ErrorKind.Generic })
      return
    }

    setError(null)
    setTxState(TxState.Sign)

    try {
      if (!chainFee) {
        setError({
          message: 'no chain fee, cannot send transaction',
          kind: ErrorKind.Validation,
        })
        return
      }

      const res = await clientState.client.signAndBroadcastSync(
        txData,
        chainFee,
      )
      setTxState(TxState.Submit)
      setTxHash(res)
    } catch (err) {
      setError({ message: (err as Error).message, kind: ErrorKind.Transaction })
      setTxState(TxState.Failed)
      console.error(err)
    }
  }, [address, clientState, chainFee, txData, setTxState])

  // Check transaction status
  useEffect(() => {
    if (
      !clientState ||
      !clientState.client ||
      !txHash ||
      txState == TxState.Success ||
      txState == TxState.Failed
    ) {
      return
    }

    // @todo repeat maximum 180 times
    const intervalId = setInterval(async () => {
      const res = await checkTransaction(
        clientState.client!,
        asteroidClient,
        txState,
        txHash,
      )
      if (res) {
        setTxState(res.status)
        if (res.error) {
          setError({ message: res.error, kind: ErrorKind.Transaction })
        }
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [txHash, txState, clientState, asteroidClient])

  // Reset state
  const resetState = useCallback(() => {
    setChainFee(null)
    setTxState(TxState.Initial)
    setTxHash('')
    setError(null)
  }, [])

  // Retry
  function retry() {
    if (chainFee) {
      sendTx()
    } else {
      setRetryCounter(retryCounter + 1)
    }
  }

  return {
    txState,
    txHash,
    error,
    chainFee,
    metaprotocolFee,
    sendTx,
    setError,
    resetState,
    retry,
  }
}

export type SubmitTxState = ReturnType<typeof useSubmitTx>
