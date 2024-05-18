import useSWR from 'swr'
import { AsteroidClient } from '~/api/client'
import { useRootContext } from '~/context/root'

const MAX_ATTEMPTS = 10

async function fetchSignatures(
  bridgeEndpoints: string[],
  fn: (client: AsteroidClient) => Promise<{ signature: string } | undefined>,
) {
  const promises = bridgeEndpoints.map((endpoint) => {
    const client = new AsteroidClient(endpoint)
    return new Promise<string>((resolve, reject) => {
      async function fetch(attempt = 0) {
        const res = await fn(client)
        if (res) {
          resolve(res.signature)
        } else {
          if (attempt < MAX_ATTEMPTS) {
            const random = Math.random() + 1
            const delay = Math.pow(2, attempt) * Math.round(random * 1000)
            console.log('Retrying fetch...', delay)
            setTimeout(() => fetch(attempt + 1), delay)
          } else {
            reject('Failed to fetch signature')
          }
        }
      }
      fetch()
    })
  })

  return Promise.all(promises)
}

export function useBridgeHistorySignatures(txHash: string) {
  const { bridgeEndpoints } = useRootContext()

  return useSWR(txHash ? ['bridge-history-signatures', txHash] : null, () =>
    fetchSignatures(bridgeEndpoints, (client) =>
      client.getBridgeHistorySignature(txHash),
    ),
  )
}

export function useBridgeTokenSignatures(txHash: string, ticker: string) {
  const { bridgeEndpoints } = useRootContext()

  return useSWR(
    txHash ? ['bridge-token-signatures', txHash, ticker] : null,
    () =>
      fetchSignatures(bridgeEndpoints, (client) =>
        client.getBridgeTokenSignature(ticker),
      ),
  )
}
