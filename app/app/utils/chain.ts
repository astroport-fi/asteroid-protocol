import { AssetList, Chain } from '@chain-registry/types'
import { assets, chains } from 'chain-registry'

export function getChains() {
  const cosmosHubChain = chains.find((asset) => asset.chain_name == 'cosmoshub')
  // Add Local Cosmos Hub
  const additionalChains: Chain[] = [
    {
      ...cosmosHubChain,
      bech32_prefix: 'cosmos',
      chain_id: 'gaialocal-1',
      chain_name: 'localcosmoshub',
      network_type: 'localnet',
      pretty_name: 'Local Cosmos Hub',
      key_algos: ['secp256k1'],
      slip44: 118,
      status: 'live',
      apis: {
        rpc: [
          {
            address: 'http://localhost:16657',
          },
        ],
        rest: [
          {
            address: 'http://localhost:1316',
          },
        ],
      },
      explorers: [
        {
          tx_page: 'http://localhost:1316/cosmos/tx/v1beta1/txs/${txHash}',
        },
      ],
    },
  ]

  return [...chains, ...additionalChains]
}

export function getAssets() {
  const cosmosHubAssets = assets.find(
    (asset) => asset.chain_name == 'cosmoshub',
  )
  const additionalAssets: AssetList[] = [
    { chain_name: 'localcosmoshub', assets: cosmosHubAssets!.assets },
  ]

  return [...assets, ...additionalAssets]
}
