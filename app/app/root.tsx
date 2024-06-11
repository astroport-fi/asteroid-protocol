import {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import {
  ErrorResponse,
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
import { Link } from 'react-daisyui'
import { clientOnly$, serverOnly$ } from 'vite-env-only'
import styles from '~/tailwind.css?url'
import { AsteroidClient } from './api/client'
import { RootContext } from './context/root'
import WalletProvider, { WalletProviderProps } from './context/wallet'
import error404Image from '~/images/background/404.png'
import error503Image from '~/images/background/503.png'

export async function loader({ context }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const status = await asteroidClient.getStatus(context.cloudflare.env.CHAIN_ID)

  if ((context.cloudflare.env.MAINTENANCE_MODE as string) === 'true') {
    throw new Response(null, {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }

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
      USE_EXTENSION_DATA: context.cloudflare.env.USE_EXTENSION_DATA,
      REST: context.cloudflare.env.REST,
      RPC: context.cloudflare.env.RPC,
      NEUTRON_BRIDGE_CONTRACT: context.cloudflare.env.NEUTRON_BRIDGE_CONTRACT,
      NEUTRON_CHAIN_ID: context.cloudflare.env.NEUTRON_CHAIN_ID,
      NEUTRON_CHAIN_NAME: context.cloudflare.env.NEUTRON_CHAIN_NAME,
      NEUTRON_RPC: context.cloudflare.env.NEUTRON_RPC,
      BRIDGE_ENDPOINTS: context.cloudflare.env.BRIDGE_ENDPOINTS.split(','),
      ASTROPORT_FACTORY_CONTRACT:
        context.cloudflare.env.ASTROPORT_FACTORY_CONTRACT,
      ASTROPORT_URL: context.cloudflare.env.ASTROPORT_URL,
    },
  })
}

function WalletProviderWrapper(props: WalletProviderProps) {
  let Provider: JSX.Element | undefined

  Provider = import.meta.env.DEV
    ? serverOnly$(<WalletProvider {...props} />)
    : undefined

  if (Provider) {
    return Provider
  }

  Provider = clientOnly$(<WalletProvider {...props} />)
  if (Provider) {
    return Provider
  }
  return <Outlet />
}

export const links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: styles },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
  ]
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Asteroid Protocol | Inscribe anything on the Hub' },
    { name: 'color-scheme', content: 'light dark' },
    {
      name: 'viewport',
      content:
        'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no',
    },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'msapplication-tap-highlight', content: 'no' },

    {
      name: 'description',
      content: 'Asteroid Protocol allows you to inscribe anything on the Hub',
    },
    { name: 'theme-color', content: '#ebb348' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { property: 'twitter:domain', content: 'https://asteroidprotocol.io' },
    {
      property: 'twitter:image',
      content: 'https://asteroidprotocol.io/banner.png',
    },
    { property: 'og:site_name', content: 'Asteroid Protocol' },
    { property: 'og:type', content: 'website' },
    {
      property: 'og:image',
      content: 'https://asteroidprotocol.io/banner.png',
    },
    {
      tagName: 'link',
      rel: 'canonical',
    },
  ]
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
      <body suppressHydrationWarning>
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
            useExtensionData: data.ENV.USE_EXTENSION_DATA == 'true',
            status: {
              baseToken: data.status?.base_token ?? '',
              baseTokenUsd: data.status?.base_token_usd ?? 0,
              lastProcessedHeight: data.status?.last_processed_height ?? 0,
              lastKnownHeight: data.status?.last_known_height ?? 0,
            },
            neutronBridgeContract: data.ENV.NEUTRON_BRIDGE_CONTRACT,
            neutronChainId: data.ENV.NEUTRON_CHAIN_ID,
            neutronChainName: data.ENV.NEUTRON_CHAIN_NAME,
            neutronRpcEndpoint: data.ENV.NEUTRON_RPC,
            bridgeEndpoints: data.ENV.BRIDGE_ENDPOINTS,
            astroportFactoryContract: data.ENV.ASTROPORT_FACTORY_CONTRACT,
            astroportUrl: data.ENV.ASTROPORT_URL,
          }}
        >
          <WalletProviderWrapper
            chainName={data.ENV.CHAIN_NAME}
            rpcEndpoint={data.ENV.RPC}
            restEndpoint={data.ENV.REST}
          />
        </RootContext.Provider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

function Error503() {
  return (
    <div className="flex flex-col w-full justify-center items-center mt-20">
      <img src={error503Image} alt="503 error" />
      <p className="max-w-2xl text-xl mt-10 uppercase">
        Sorry, we&apos;re down for scheduled maintenance right now. We&apos;ll
        be back soon. <br />
        To stay informed about the latest updates please keep an eye on Astroid
        Protocol{' '}
        <Link
          className="underline"
          href="https://t.me/asteroidxyz"
          title="Astroid Protocol Telegram Group"
        >
          Telegram Group
        </Link>
      </p>
    </div>
  )
}

function Error404() {
  return (
    <div className="flex flex-col w-full justify-center items-center mt-20">
      <img src={error404Image} alt="404 error" />
      <p className="max-w-2xl text-xl mt-10 uppercase">
        Beep. Boop. Bop. You&apos;ve discovered an uncharted part of the galaxy.
        Unfortunately, it&apos;s not suitable for life and/or
        inscription-related activity. Please return{' '}
        <Link href="https://asteroidprotocol.io" className="underline">
          home
        </Link>{' '}
        now.
      </p>
    </div>
  )
}

function ResponseError({ error }: { error: ErrorResponse }) {
  if (error.status === 503) {
    return <Error503 />
  }

  if (error.status === 404) {
    return <Error404 />
  }

  return (
    <div className="flex flex-col w-full justify-center items-center mt-20">
      <p className="max-w-2xl text-xl mt-10 uppercase">
        Unknown error, status: {error.status}, statusText: {error.statusText}
        Please try to reload the page and if the problem persists, contact us in
        Astroid Protocol{' '}
        <Link
          className="underline"
          href="https://t.me/asteroidxyz"
          title="Astroid Protocol Telegram Group"
        >
          Telegram Group
        </Link>
        .
      </p>
    </div>
  )
}

function HandleError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error)) {
    return <ResponseError error={error} />
  }

  if (error instanceof Error) {
    throw error
  }

  console.error('Unknown error', error)

  return 'Unknown Error'
}

export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <title>Oh no!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <HandleError />
        <Scripts />
      </body>
    </html>
  )
}
