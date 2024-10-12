import type {
  ChainWalletBase,
  WalletModalProps,
  WalletRepo,
} from '@cosmos-kit/core'
import { wallets as keplr } from '@cosmos-kit/keplr-extension'
import { wallets as keplrMobile } from '@cosmos-kit/keplr-mobile'
import { wallets as leap } from '@cosmos-kit/leap-extension'
import { wallets as leapMobile } from '@cosmos-kit/leap-mobile'
import { ChainProvider } from '@cosmos-kit/react-lite'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { WalletIcon } from '@heroicons/react/24/solid'
import { Outlet } from '@remix-run/react'
import { useEffect, useRef } from 'react'
import { Button, Loading, Modal } from 'react-daisyui'
import { useClipboard } from 'use-clipboard-copy'
import { WalletStatus } from '~/components/wallet/Wallet'
import { getAssets, getChains } from '~/utils/chain'
import { getEllipsisTxt } from '~/utils/string'

function WalletContent({ walletRepo }: { walletRepo: WalletRepo }) {
  const status = walletRepo.current?.walletStatus ?? WalletStatus.Disconnected
  const clipboard = useClipboard({ copiedTimeout: 800 })
  const message = walletRepo.current?.message
  const address = walletRepo.current?.address
  if (message) {
    console.log('wallet message', message)
  }

  useEffect(() => {
    if (status === WalletStatus.Error || status === WalletStatus.Rejected) {
      console.log('wallet disconnect')
      walletRepo.current?.disconnect()
    }
  }, [status, walletRepo])

  if (status === WalletStatus.Disconnected) {
    let wallets: ChainWalletBase[]
    if (walletRepo.isMobile) {
      wallets = walletRepo?.wallets.filter((w) =>
        typeof w.walletInfo.mobileDisabled === 'boolean'
          ? !w.walletInfo.mobileDisabled
          : !w.walletInfo.mobileDisabled(),
      )
    } else {
      wallets = walletRepo?.wallets.filter((w) =>
        w.walletName.endsWith('extension'),
      )
    }

    return (
      <>
        <Modal.Header className="mb-6 text-center">Choose Wallet</Modal.Header>
        {wallets.map(({ walletName, walletInfo, connect }) => (
          <Button
            key={walletName}
            className="mb-4 text-lg justify-start"
            size="lg"
            startIcon={
              <img
                src={walletInfo.logo as string}
                alt={walletInfo.prettyName}
                className="w-8"
              />
            }
            onClick={() => connect()}
          >
            <span className="ml-1">{walletInfo.prettyName}</span>
          </Button>
        ))}
      </>
    )
  }

  if (status === WalletStatus.Connecting) {
    return (
      <>
        <Modal.Header className="mb-6 text-center">Connecting</Modal.Header>
        <div className="flex justify-center items-center">
          <Loading variant="spinner" size="md" />
        </div>
      </>
    )
  }

  if (status === WalletStatus.Connected) {
    return (
      <>
        <Modal.Header className="mb-6 text-center">
          Connected Wallet
        </Modal.Header>
        <Button
          variant="outline"
          className="rounded-full"
          size="sm"
          color="neutral"
          onClick={() => clipboard.copy(address)}
          endIcon={<ClipboardDocumentIcon className="size-5" />}
        >
          {clipboard.copied ? 'Copied' : getEllipsisTxt(address)}
        </Button>
        <Button
          onClick={() => walletRepo.disconnect()}
          color="primary"
          className="mt-4"
          startIcon={<WalletIcon className="size-5" />}
        >
          Disconnect
        </Button>
      </>
    )
  }
}

const MyModal = ({ isOpen, setOpen, walletRepo }: WalletModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const status = walletRepo?.current?.walletStatus ?? WalletStatus.Disconnected
  const prevStatus = useRef(status)

  useEffect(() => {
    if (isOpen) dialogRef?.current?.showModal()
  }, [isOpen])

  useEffect(() => {
    if (
      status === WalletStatus.Connected &&
      prevStatus.current === WalletStatus.Connecting
    ) {
      setOpen(false)
      dialogRef?.current?.close()
    }
  }, [prevStatus, status, setOpen])

  useEffect(() => {
    prevStatus.current = status
  }, [status])

  return (
    <Modal
      tabIndex={-1}
      ref={dialogRef}
      backdrop
      className="max-w-80"
      onBlur={() => {
        setOpen(false)
      }}
    >
      <Modal.Body className="flex flex-col">
        {walletRepo && <WalletContent walletRepo={walletRepo} />}
      </Modal.Body>
    </Modal>
  )
}

export interface WalletProviderProps {
  chainName: string
  rpcEndpoint: string
  restEndpoint: string
  neutronChainName: string
  neutronRpcEndpoint: string
  neutronRestEndpoint: string
}

export default function WalletProvider({
  chainName,
  rpcEndpoint,
  restEndpoint,
  neutronChainName,
  neutronRpcEndpoint,
  neutronRestEndpoint,
}: WalletProviderProps) {
  return (
    <ChainProvider
      chains={getChains()}
      subscribeConnectEvents={true}
      assetLists={getAssets()}
      wallets={[...keplr, ...leap, ...keplrMobile, ...leapMobile]}
      walletModal={MyModal}
      sessionOptions={{ duration: Math.pow(2, 31) - 1 }}
      endpointOptions={{
        isLazy: true,
        endpoints: {
          [chainName]: {
            rpc: [rpcEndpoint],
            rest: [restEndpoint],
          },
          [neutronChainName]: {
            rpc: [neutronRpcEndpoint],
            rest: [neutronRestEndpoint],
          },
        },
      }}
      walletConnectOptions={{
        signClient: {
          projectId: 'a8510432ebb71e6948cfd6cde54b70f7',
          metadata: {
            name: 'Asteroid',
            description: 'Asteroid Protocol',
            url: 'https://asteroidprotocol.io/app/',
            icons: [
              'https://raw.githubusercontent.com/cosmology-tech/cosmos-kit/main/packages/docs/public/favicon-96x96.png',
            ],
          },
        },
      }}
    >
      <Outlet />
    </ChainProvider>
  )
}
