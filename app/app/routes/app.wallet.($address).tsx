import { WalletIcon } from '@heroicons/react/20/solid'
import { Outlet, useLocation, useParams } from '@remix-run/react'
import { Link as DaisyLink, Tabs } from 'react-daisyui'
import Lottie from '~/components/Lottie'
import Tab from '~/components/Tab'
import { Wallet } from '~/components/wallet/Wallet'
import useStargazeName from '~/hooks/useStargazeName'
import useAddress from '~/hooks/wallet/useAddress'
import noWalletAnimationData from '~/lottie/no-wallet.json'

enum WalletTab {
  Tokens,
  Collections,
  Inscriptions,
  Deployed,
  Sales,
  Bridge,
}

export default function WalletPage() {
  let { address } = useParams()
  const walletAddress = useAddress()

  if (!address) {
    address = walletAddress
  }

  const { name: stargazeName } = useStargazeName(address ?? '')

  const location = useLocation()
  const paths = location.pathname.split('/')
  const lastPath = paths[paths.length - 1]
  let active = WalletTab.Tokens
  if (lastPath === 'inscriptions') {
    active = WalletTab.Inscriptions
  } else if (lastPath === 'deployed') {
    active = WalletTab.Deployed
  } else if (lastPath === 'sales') {
    active = WalletTab.Sales
  } else if (lastPath === 'collections') {
    active = WalletTab.Collections
  } else if (lastPath === 'bridge') {
    active = WalletTab.Bridge
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
    <div className="flex flex-col items-center overflow-y-scroll">
      <div className="flex flex-col items-center">
        {stargazeName && (
          <span className="mb-4 text-md font-light">{stargazeName}</span>
        )}
        <DaisyLink className="text-primary border border-primary flex items-center rounded-full btn-md break-all">
          <WalletIcon className="w-5 mr-2" />
          {address}
        </DaisyLink>
      </div>
      <Tabs
        variant="bordered"
        className="w-full mt-8 lg:mt-12 overflow-x-auto shrink-0 no-scrollbar"
      >
        <Tab to="" active={active === WalletTab.Tokens}>
          Tokens
        </Tab>
        <Tab to="collections" active={active === WalletTab.Collections}>
          Collections
        </Tab>
        <Tab to="inscriptions" active={active === WalletTab.Inscriptions}>
          Inscriptions
        </Tab>
        <Tab to="deployed" active={active === WalletTab.Deployed}>
          Deployed
        </Tab>
        <Tab to="sales" active={active === WalletTab.Sales}>
          <span className="hidden lg:inline lg:mr-1">Marketplace</span>Sales
        </Tab>
        <Tab to="bridge" active={active === WalletTab.Bridge}>
          Bridge History
        </Tab>
      </Tabs>
      <Outlet />
    </div>
  )
}
