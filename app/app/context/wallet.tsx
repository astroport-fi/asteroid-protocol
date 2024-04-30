import type { WalletModalProps, WalletRepo } from '@cosmos-kit/core'
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
import useAddress from '~/hooks/useAddress'
import { getAssets, getChains } from '~/utils/chain'
import { getEllipsisTxt } from '~/utils/string'

function WalletContent({ walletRepo }: { walletRepo: WalletRepo }) {
  const status = walletRepo.current?.walletStatus ?? WalletStatus.Disconnected
  const address = useAddress()
  const clipboard = useClipboard({ copiedTimeout: 800 })
  const message = walletRepo.current?.message
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
    return (
      <>
        <Modal.Header className="mb-6 text-center">Choose Wallet</Modal.Header>
        {walletRepo.wallets.map(({ walletName, walletInfo, connect }) => (
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

const WalletModal = ({ isOpen, setOpen, walletRepo }: WalletModalProps) => {
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

export default function WalletProvider() {
  return (
    <ChainProvider
      chains={getChains()}
      subscribeConnectEvents={true}
      assetLists={getAssets()}
      wallets={[...keplr, ...leap, ...keplrMobile, ...leapMobile]}
      walletModal={WalletModal}
      sessionOptions={{ duration: Math.pow(2, 31) - 1 }}
      walletConnectOptions={{
        signClient: {
          projectId: '3018abf8adaea881049a7c03bcf2d3aa',
          metadata: {
            name: 'Asteroid Protocol',
            description:
              'Asteroid Protocol allows you to inscribe anything on the Hub',
            url: 'https://asteroidprotocol.io/app/',
            icons: ['https://asteroidprotocol.io/apple-touch-icon.png'],
          },
        },
      }}
    >
      <Outlet />
    </ChainProvider>
  )
}
