import { useEffect, useState } from 'react'
import { clientOnly$ } from 'vite-env-only'
import useCosmosClient from './useCosmosClient'
import useAddress from './wallet/useAddress'

export default function useAtomBalance() {
  const client = clientOnly$(useCosmosClient())
  const address = useAddress()
  const [balance, setBalance] = useState<number>(0)

  useEffect(() => {
    if (address && client) {
      client.client?.getAtomBalance(address).then(setBalance)
    }
  }, [client, address])

  return balance
}
