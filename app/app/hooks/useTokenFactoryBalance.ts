import { Coin } from '@cosmjs/stargate'
import { useEffect, useState } from 'react'
import useAsteroidBridgeClient from '~/hooks/bridge/useAsteroidBridgeClient'

export function useTokenFactoryDenom(ticker: string) {
  const bridgeClientState = useAsteroidBridgeClient()
  const [state, setState] = useState<{
    isLoading: boolean
    denom: string | null
  }>({ isLoading: true, denom: null })

  useEffect(() => {
    if (!bridgeClientState || !bridgeClientState.client) {
      return
    }

    bridgeClientState.client.token({ ticker }).then((token) => {
      if (token.denom) {
        setState({ denom: token.denom, isLoading: false })
      } else {
        setState({ denom: null, isLoading: false })
      }
    })
  }, [bridgeClientState, ticker])
  return state
}

export function useTokenFactoryBalance(
  ticker: string,
  address: string | undefined,
) {
  const bridgeClientState = useAsteroidBridgeClient()
  const [denom, setDenom] = useState<string | null>(null)
  const [balance, setBalance] = useState<Coin | null>(null)
  useEffect(() => {
    if (!bridgeClientState || !bridgeClientState.client) {
      return
    }

    bridgeClientState.client.token({ ticker }).then((token) => {
      if (token.denom) {
        setDenom(token.denom)
      }
    })
  }, [bridgeClientState, ticker])

  useEffect(() => {
    if (!bridgeClientState?.client || !denom || !address) {
      return
    }

    bridgeClientState.client.client
      .getBalance(address, denom)
      .then((balance) => setBalance(balance))
  }, [bridgeClientState?.client, address, denom])

  return balance
}
