import type { DeliverTxResponse } from '@cosmjs/stargate'
import { AsteroidService } from '../service/asteroid.js'

export async function checkTx(
  asteroidClient: AsteroidService,
  response: DeliverTxResponse,
) {
  if (response.code) {
    throw new Error(`Transaction failed with error code ${response.code}`)
  }

  console.log('Transaction was found on chain, now checking indexer')
  await checkIndexerStatusInLoop(asteroidClient, response.transactionHash)
}

async function checkIndexerStatusInLoop(
  asteroidClient: AsteroidService,
  txHash: string,
) {
  const indexerStatus = await checkIndexerStatus(asteroidClient, txHash)
  if (!indexerStatus) {
    // wait 2 seconds and check again in loop
    console.log('.')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return checkIndexerStatusInLoop(asteroidClient, txHash)
  }
}

async function checkIndexerStatus(
  asteroidClient: AsteroidService,
  txHash: string,
) {
  // Transaction was found on chain, now check indexer
  const transactionStatus = await asteroidClient.getTransactionStatus(txHash)

  if (transactionStatus) {
    // Indexer has it, keep checking until statusMessage changes
    // to something else than pending
    if (transactionStatus.toLowerCase() == 'success') {
      return true
    } else if (transactionStatus.toLowerCase().includes('error')) {
      // We hit an error
      throw new Error(transactionStatus)
    }
  }

  return false
}
