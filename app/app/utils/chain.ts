import { AssetList, Chain } from '@chain-registry/types'
import { assets, chains } from 'chain-registry'

export function getChains() {
  const cosmosHubChain = chains.find((asset) => asset.chain_name == 'cosmoshub')
  const neutronChain = chains.find((asset) => asset.chain_name == 'neutron')

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
    {
      ...neutronChain,
      bech32_prefix: 'neutron',
      chain_id: 'test-1',
      chain_name: 'localneutron',
      network_type: 'localnet',
      pretty_name: 'Local Neutron',
      key_algos: ['secp256k1'],
      slip44: 118,
      status: 'live',
      apis: {
        rpc: [
          {
            address: 'http://localhost:26657',
          },
        ],
        rest: [
          {
            address: 'http://localhost:1317',
          },
        ],
      },
      explorers: [
        {
          tx_page: 'http://localhost:1317/cosmos/tx/v1beta1/txs/${txHash}',
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
  const neutronAssets = assets.find((asset) => asset.chain_name == 'neutron')
  const additionalAssets: AssetList[] = [
    { chain_name: 'localcosmoshub', assets: cosmosHubAssets!.assets },
    { chain_name: 'localneutron', assets: neutronAssets!.assets },
  ]

  return [...assets, ...additionalAssets]
}
