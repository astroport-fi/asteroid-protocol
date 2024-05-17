import { Coin } from '@cosmjs/stargate'
import { useEffect, useState } from 'react'
import useAsteroidBridgeClient from '~/hooks/useAsteroidBridgeClient'

export function useTokenFactoryBalance(
  ticker: string,
  address: string | undefined,
) {
  const bridgeClient = useAsteroidBridgeClient()
  const [denom, setDenom] = useState<string | null>(null)
  const [balance, setBalance] = useState<Coin | null>(null)
  useEffect(() => {
    if (!bridgeClient) {
      return
    }

    bridgeClient.token({ ticker }).then((token) => {
      if (token.denom) {
        setDenom(token.denom)
      }
    })
  }, [bridgeClient, ticker])

  useEffect(() => {
    if (!bridgeClient?.client || !denom || !address) {
      return
    }

    bridgeClient.client
      .getBalance(address, denom)
      .then((balance) => setBalance(balance))
  }, [bridgeClient?.client, address, denom])

  return balance
}
