import { Link, Outlet, useLocation, useParams } from '@remix-run/react'
import clsx from 'clsx'
import { PropsWithChildren } from 'react'
import { Tabs } from 'react-daisyui'
import useAddress from '~/hooks/useAddress'

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

export default function Wallet() {
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

  return (
    <div>
      <div>Wallet</div>
      {address && (
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
      )}
      <div className="py-8">
        <Outlet />
      </div>
    </div>
  )
}
