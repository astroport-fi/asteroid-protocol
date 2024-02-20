import { AssetList, Chain } from '@chain-registry/types'
import { ChainProvider } from '@cosmos-kit/react'
import { LoaderFunctionArgs } from '@remix-run/cloudflare'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  json,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import { assets, chains } from 'chain-registry'
import { wallets } from 'cosmos-kit'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import { RootContext } from './context/root'
import { AsteroidService } from './services/asteroid'
import '~/tailwind.css'

// Add Local Cosmos Hub
const cosmosHubChain = chains.find((asset) => asset.chain_name == 'cosmoshub')
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

const cosmosHubAssets = assets.find((asset) => asset.chain_name == 'cosmoshub')
const additionalAssets: AssetList[] = [
  { chain_name: 'localcosmoshub', assets: cosmosHubAssets!.assets },
]

export async function loader({ context }: LoaderFunctionArgs) {
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)
  const status = await asteroidService.getStatus(context.env.CHAIN_ID)

  return json({
    status,
    ENV: {
      CHAIN_ID: context.env.CHAIN_ID,
      CHAIN_NAME: context.env.CHAIN_NAME,
      TX_EXPLORER: context.env.TX_EXPLORER,
      GAS_PRICE: context.env.GAS_PRICE,
      MAX_FILE_SIZE: context.env.MAX_FILE_SIZE,
      ASTEROID_API: context.env.ASTEROID_API,
      ASTEROID_API_WSS: context.env.ASTEROID_API_WSS,
      USE_IBC: context.env.USE_IBC,
    },
  })
}

export default function App() {
  const data = useLoaderData<typeof loader>()

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <RootContext.Provider
          value={{
            chainId: data.ENV.CHAIN_ID,
            chainName: data.ENV.CHAIN_NAME,
            gasPrice: data.ENV.GAS_PRICE,
            txExplorer: data.ENV.TX_EXPLORER,
            maxFileSize: parseInt(data.ENV.MAX_FILE_SIZE),
            asteroidApi: data.ENV.ASTEROID_API,
            asteroidWs: data.ENV.ASTEROID_API_WSS,
            useIbc: data.ENV.USE_IBC != 'false',
            status: {
              baseToken: data.status?.base_token ?? '',
              baseTokenUsd: data.status?.base_token_usd ?? 0,
              lastProcessedHeight: data.status?.last_processed_height ?? 0,
              lastKnownHeight: data.status?.last_known_height ?? 0,
            },
          }}
        >
          <ChainProvider
            chains={[...chains, ...additionalChains]}
            assetLists={[...assets, ...additionalAssets]}
            wallets={[wallets[0], wallets[2]]}
            // walletConnectOptions={{
            //   signClient: {
            //     projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
            //     relayUrl: 'wss://relay.walletconnect.org',
            //     metadata: {
            //       name: 'Asteroid',
            //       description: 'Asteroid Protocol',
            //       url: 'https://asteroidprotocol.io/app/',
            //       icons: [
            //         'https://raw.githubusercontent.com/cosmology-tech/cosmos-kit/main/packages/docs/public/favicon-96x96.png',
            //       ],
            //     },
            //   },
            // }}
          >
            <div>
              <Navbar />
              <div className="mt-16 py-8 px-16 overflow-y-scroll h-[calc(100vh-6rem)]">
                <Outlet />
              </div>
              <Footer />
            </div>
          </ChainProvider>
        </RootContext.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// @todo
// export function ErrorBoundary() {
//   const error = useRouteError()
//   console.error(error)
//   return (
//     <html lang="en">
//       <head>
//         <title>Oh no!</title>
//         <Meta />
//         <Links />
//       </head>
//       <body>
//         <h1>
//           {isRouteErrorResponse(error)
//             ? `${error.status} ${error.statusText}`
//             : error instanceof Error
//               ? error.message
//               : 'Unknown Error'}
//         </h1>
//         <Scripts />
//       </body>
//     </html>
//   )
// }
