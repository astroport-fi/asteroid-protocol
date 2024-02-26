import { Link, Outlet, useLocation, useParams } from '@remix-run/react'
import clsx from 'clsx'
import { PropsWithChildren } from 'react'
import { Link as DaisyLink, Tabs } from 'react-daisyui'
import Lottie from '~/components/Lottie'
import { Wallet } from '~/components/wallet/Wallet'
import useAddress from '~/hooks/useAddress'
import noWalletAnimationData from '~/lottie/no-wallet.json'

function Tab({
  active,
  to,
  children,
}: PropsWithChildren<{ active?: boolean; to: string }>) {
  const classes = clsx('tab', {
    'tab-active': active,
  })
  return (
    <Link role="tab" className={classes} to={to}>
      {children}
    </Link>
  )
}

enum WalletTab {
  Tokens,
  Inscriptions,
  Deployed,
}

export default function WalletPage() {
  let { address } = useParams()
  const walletAddress = useAddress()

  if (!address) {
    address = walletAddress
  }

  const location = useLocation()
  const paths = location.pathname.split('/')
  const lastPath = paths[paths.length - 1]
  let active = WalletTab.Tokens
  if (lastPath === 'inscriptions') {
    active = WalletTab.Inscriptions
  } else if (lastPath === 'deployed') {
    active = WalletTab.Deployed
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center text-center bg-base-200 p-16 rounded-xl">
        <h1 className="text-2xl font-bold">Welcome to Asteroid Protocol</h1>
        <p className="mt-4">
          Asteroid Protocol is the first metaprotocol framework that allows you
          to inscribe arbitrary content on the Cosmos Hub.
          <DaisyLink
            className="ml-1"
            color="primary"
            href="https://medium.com/@delphilabs/introducing-asteroid-protocol-an-open-source-framework-for-inscriptions-and-tokens-on-cosmos-hub-03df146d48b1"
            target="_blank"
          >
            Learn more
          </DaisyLink>
        </p>
        <Lottie animationData={noWalletAnimationData} />
        <h2 className="text-xl font-semibold">No wallet connected</h2>
        <p>
          Connect your wallet to inscribe content, create tokens, trade and more
        </p>
        <Wallet color="primary" className="btn-md mt-4" />
        <div className="mt-12">
          <h3 className="text-lg">Not ready yet?</h3>
          <p>No problem, you can browse everything without restriction</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Tabs variant="bordered">
        <Tab to="" active={active === WalletTab.Tokens}>
          Tokens
        </Tab>
        <Tab to="inscriptions" active={active === WalletTab.Inscriptions}>
          Inscriptions
        </Tab>
        <Tab to="deployed" active={active === WalletTab.Deployed}>
          Deployed
        </Tab>
      </Tabs>
      <div className="py-8">
        <Outlet />
      </div>
    </div>
  )
}
