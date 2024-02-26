import { TxInscription, prepareTx } from '@asteroid-protocol/sdk'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRootContext } from '~/context/root'
import useAsteroidClient from '~/hooks/useAsteroidClient'
import useClient, { SigningClient } from '~/hooks/useClient'
import { AsteroidService } from '~/services/asteroid'
import useAddress from './useAddress'

export enum TxState {
  Initial,
  Submit,
  Sign,
  SuccessOnchain,
  SuccessIndexer,
  SuccessInscribed,
  Failed,
}

interface CheckResult {
  status: TxState
  error?: string
}

async function checkTransaction(
  client: SigningClient,
  asteroidClient: AsteroidService,
  txState: TxState,
  txHash: string,
): Promise<CheckResult | undefined> {
  if (txState == TxState.Submit) {
    const tx = await client.getTx(txHash)
    if (tx && tx.code == 0) {
      return { status: TxState.SuccessOnchain }
    }
  } else {
    // Transaction was found on chain, now check indexer
    const transactionStatus = await asteroidClient.getTransactionStatus(txHash)

    if (transactionStatus) {
      // Indexer has it, keep checking until statusMessage changes
      // to something else than pending
      if (transactionStatus.toLowerCase() == 'success') {
        return { status: TxState.SuccessInscribed }
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

export default function useSubmitTx(txInscription: TxInscription | null) {
  const [retryCounter, setRetryCounter] = useState(0)
  const { useIbc } = useRootContext()

  // deps
  const client = useClient(retryCounter)
  const asteroidClient = useAsteroidClient()
  const address = useAddress()

  // state
  const [txState, setTxState] = useState<TxState>(TxState.Initial)
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [chainFee, setChainFee] = useState(0)

  const txData = useMemo(() => {
    if (!address || !txInscription) {
      return null
    }

    return prepareTx(address, txInscription.urn, [txInscription], { useIbc })
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
    if (!txData) {
      setError('There are no transaction data to estimate chain fee')
      return
    }

    if (!client) {
      setError('There is no client to estimate chain fee')
      return
    }

    client
      .estimate(txData)
      .then((res) => {
        setChainFee(res)
        setError(null)
      })
      .catch((err) => {
        setError((err as Error).message)
      })
  }, [txData, client, retryCounter, chainFee])

  // Send transaction
  const sendTx = useCallback(async () => {
    if (!address) {
      setError('no address, connect wallet first')
      return
    }

    if (!client) {
      setError('invalid client')
      return
    }

    if (!txData) {
      setError('invalid txData')
      return
    }

    setError(null)
    setTxState(TxState.Sign)

    try {
      const res = await client.signAndBroadcast(txData)

      if (res.code) {
        setError(`Transaction failed with error code: ${res.code}`)
        return
      }

      setTxState(TxState.Submit)
      setTxHash(res.transactionHash)
    } catch (err) {
      setError((err as Error).message)
      setTxState(TxState.Failed)
      console.error(err)
    }
  }, [address, client, txData, setTxState])

  // Check transaction status
  useEffect(() => {
    if (
      !client ||
      !txHash ||
      txState == TxState.SuccessInscribed ||
      txState == TxState.Failed
    ) {
      return
    }

    // @todo repeat maximum 180 times
    const intervalId = setInterval(async () => {
      const res = await checkTransaction(
        client,
        asteroidClient,
        txState,
        txHash,
      )
      if (res) {
        setTxState(res.status)
        if (res.error) {
          setError(res.error)
        }
      }
    }, 1000)

    return () => clearInterval(intervalId)
  }, [txHash, txState, client, asteroidClient])

  // Reset state
  function resetState() {
    setChainFee(0)
    setTxState(TxState.Initial)
    setTxHash('')
    setError(null)
  }

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
    resetState,
    retry,
  }
}
