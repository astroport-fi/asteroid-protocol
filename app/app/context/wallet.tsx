import { ChainProvider } from '@cosmos-kit/react'
import { Outlet } from '@remix-run/react'
import { wallets } from 'cosmos-kit'
import { getAssets, getChains } from '~/utils/chain'

export default function WalletProvider() {
  return (
    <ChainProvider
      modalTheme={{
        modalContentClassName: 'cosmoskit-content',
        modalChildrenClassName: 'cosmoskit-children',
      }}
      chains={getChains()}
      assetLists={getAssets()}
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
      <Outlet />
    </ChainProvider>
  )
}
