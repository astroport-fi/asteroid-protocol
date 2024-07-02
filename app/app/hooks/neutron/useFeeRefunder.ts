import { Coin } from '@cosmjs/stargate'
import { useMemo } from 'react'
import useSWR from 'swr'
import { useRootContext } from '~/context/root'
import { fetcher } from '~/hooks/utils'

export type ParamsFeeRefunderInfo = {
  min_fee: {
    recv_fee: Coin[]
    ack_fee: Coin[]
    timeout_fee: Coin[]
  }
}

export type ParamsFeeRefunderResponse = {
  params: ParamsFeeRefunderInfo
}

export function useFeeRefunder() {
  const { neutronRestEndpoint } = useRootContext()
  return useSWR<ParamsFeeRefunderResponse>(
    `${neutronRestEndpoint}/neutron-org/neutron/feerefunder/params`,
    fetcher,
  )
}

export function useIbcFee() {
  const { data } = useFeeRefunder()
  return useMemo(() => {
    if (!data) {
      return
    }

    const { ack_fee, timeout_fee } = data.params.min_fee
    return parseInt(ack_fee[0].amount) + parseInt(timeout_fee[0].amount) + 1
  }, [data])
}
