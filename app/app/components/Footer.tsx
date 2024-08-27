import { Link } from '@remix-run/react'
import { useEffect, useMemo, useState } from 'react'
import { Link as DaisyLink } from 'react-daisyui'
import { clientOnly$ } from 'vite-env-only'
import { Status } from '~/api/status'
import { useRootContext } from '~/context/root'
import useAsteroidClient from '~/hooks/api/useAsteroidClient'
import useChain from '~/hooks/wallet/useChain'
import Gitbook from './icons/gitbook'
import Telegram from './icons/telegram'
import Twitter from './icons/twitter'

export default function Footer() {
  const { chainId, chainName, status: initialStatus } = useRootContext()
  const [status, setStatus] = useState<Status>({
    base_token: initialStatus.baseToken,
    base_token_usd: initialStatus.baseTokenUsd,
    last_processed_height: initialStatus.lastProcessedHeight,
    last_known_height: initialStatus.lastKnownHeight,
  })
  const [height, setHeight] = useState<number>(0)

  const lag =
    Math.max(status.last_known_height!, height) - status.last_processed_height

  const { getStargateClient } = useChain(chainName)
  useEffect(() => {
    if (!getStargateClient) {
      return
    }
    getStargateClient().then((client) => {
      client.getHeight().then(setHeight)
    })
  }, [getStargateClient])

  const asteroidClient = useAsteroidClient(clientOnly$(true))
  const wsSubscription = clientOnly$(
    useMemo(() => {
      if (!asteroidClient) {
        return null
      }
      return asteroidClient.statusSubscription(chainId)
    }, [asteroidClient, chainId]),
  )

  useEffect(() => {
    if (!wsSubscription) {
      return
    }

    wsSubscription.on(({ status: newStatus }) => {
      if (newStatus[0]) {
        setStatus(newStatus[0])
      }
    })
  }, [wsSubscription, chainId])

  return (
    <footer className="footer fixed left-0 bottom-0 items-center bg-base-200 text-neutral-content border-t border-t-neutral">
      <nav className="flex gap-0 justify-between w-full">
        <div className="flex">
          <div className="flex flex-row items-center uppercase border-r border-r-neutral px-4 py-2.5">
            <span className="mr-2">Indexer</span>
            {lag <= 1 && <span className="text-success">In Sync</span>}
            {lag > 1 && lag < 5 && <span className="text-success">+{lag}</span>}
            {lag >= 5 && lag < 30 && (
              <span className="text-warning">+{lag}</span>
            )}
            {lag >= 30 && <span className="text-error">+{lag} Lagging</span>}
          </div>
          <div className="flex flex-row h-full items-center border-r border-r-neutral px-4 py-2">
            <DaisyLink
              href="https://t.me/asteroidxyz"
              title="Astroid Protocol Telegram Group"
              target="_blank"
            >
              <Telegram className="w-5" />
            </DaisyLink>
            <DaisyLink
              href="https://twitter.com/asteroidxyz"
              title="Astroid Protocol on X"
              target="_blank"
              className="ml-4"
            >
              <Twitter className="w-5" />
            </DaisyLink>
            <DaisyLink
              href="https://docs.asteroidprotocol.io"
              title="Astroid Protocol Docs"
              target="_blank"
              className="ml-4"
            >
              <Gitbook className="w-5" />
            </DaisyLink>
          </div>
          <div className="flex items-center border-r border-r-neutral px-4 py-2.5">
            ATOM ${status.base_token_usd}
          </div>
        </div>
        <div className="flex items-center border-l border-l-neutral">
          <Link
            to="/app/terms-of-service"
            className="border-r border-r-neutral px-4 py-2.5 hover:underline"
          >
            Terms Of Service
          </Link>
          <Link
            to="/app/privacy-policy"
            className="border-r border-r-neutral px-4 py-2.5 hover:underline"
          >
            Privacy Policy
          </Link>
          <Link to="/app/dmca-notices" className="px-4 hover:underline">
            DMCA Notices
          </Link>
        </div>
      </nav>
    </footer>
  )
}
