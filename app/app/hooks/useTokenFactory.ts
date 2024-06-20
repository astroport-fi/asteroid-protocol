import { Coin } from '@cosmjs/stargate'
import { Metadata } from 'cosmjs-types/cosmos/bank/v1beta1/bank'
import { useEffect, useState } from 'react'
import { useRootContext } from '~/context/root'
import useNeutronClient from './useNeutronClient'

export function useTokenFactoryDenom(ticker: string) {
  const { neutronBridgeContract } = useRootContext()
  return `factory/${neutronBridgeContract}/${ticker}`
}

export function useTokenFactoryMetadata(ticker: string) {
  const neutronClient = useNeutronClient()
  const denom = useTokenFactoryDenom(ticker)
  const [state, setState] = useState<{
    metadata: Metadata | null
    isLoading: boolean
  }>({ metadata: null, isLoading: true })

  useEffect(() => {
    if (!neutronClient || !denom) {
      return
    }

    neutronClient
      .getDenomMetadata(denom)
      .then((metadata) => setState({ metadata, isLoading: false }))
      .catch(() => setState({ metadata: null, isLoading: false }))
  }, [neutronClient, denom])

  return state
}

export function useTokenFactoryBalance(
  ticker: string,
  address: string | undefined,
) {
  const neutronClient = useNeutronClient()
  const denom = useTokenFactoryDenom(ticker)
  const [balance, setBalance] = useState<Coin | null>(null)

  useEffect(() => {
    if (!neutronClient || !denom || !address) {
      return
    }

    neutronClient
      .getBalance(address, denom)
      .then((balance) => setBalance(balance))
  }, [neutronClient, address, denom])

  return balance
}

export function useAllBalances(address: string | undefined) {
  const neutronClient = useNeutronClient()
  const [balances, setBalances] = useState<readonly Coin[] | null>(null)

  useEffect(() => {
    if (!neutronClient || !address) {
      return
    }

    neutronClient.getAllBalances(address).then((res) => setBalances(res))
  }, [neutronClient, address])

  return balances
}
