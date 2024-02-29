import { LoaderFunctionArgs, MetaFunction } from '@remix-run/cloudflare'
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
import { clientOnly$, serverOnly$ } from 'vite-env-only'
import { AsteroidClient } from './api/client'
import { RootContext } from './context/root'
import WalletProvider from './context/wallet'
import '~/tailwind.css'

export async function loader({ context }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const status = await asteroidClient.getStatus(context.cloudflare.env.CHAIN_ID)

  return json({
    status,
    ENV: {
      CHAIN_ID: context.cloudflare.env.CHAIN_ID,
      CHAIN_NAME: context.cloudflare.env.CHAIN_NAME,
      TX_EXPLORER: context.cloudflare.env.TX_EXPLORER,
      GAS_PRICE: context.cloudflare.env.GAS_PRICE,
      MAX_FILE_SIZE: context.cloudflare.env.MAX_FILE_SIZE,
      ASTEROID_API: context.cloudflare.env.ASTEROID_API,
      ASTEROID_API_WSS: context.cloudflare.env.ASTEROID_API_WSS,
      USE_IBC: context.cloudflare.env.USE_IBC,
      REST: context.cloudflare.env.REST,
      RPC: context.cloudflare.env.RPC,
    },
  })
}

function WalletProviderWrapper() {
  let Provider: JSX.Element | undefined

  Provider = import.meta.env.DEV ? serverOnly$(<WalletProvider />) : undefined

  if (Provider) {
    return Provider
  }

  Provider = clientOnly$(<WalletProvider />)
  if (Provider) {
    return Provider
  }
  return <Outlet />
}

export const meta: MetaFunction = () => {
  return [{ title: 'Asteroid Protocol | Inscribe anything on the Hub' }]
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
            restEndpoint: data.ENV.REST,
            rpcEndpoint: data.ENV.RPC,
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
          <WalletProviderWrapper />
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
