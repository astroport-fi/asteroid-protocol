import { useEffect, useState } from 'react'
import { Link } from 'react-daisyui'
import { clientOnly$ } from 'vite-env-only'
import { Status } from '~/api/status'
import { useRootContext } from '~/context/root'
import useAsteroidClient from '~/hooks/useAsteroidClient'

export default function Footer() {
  const { chainId, status: initialStatus } = useRootContext()
  const [status, setStatus] = useState<Status>({
    base_token: initialStatus.baseToken,
    base_token_usd: initialStatus.baseTokenUsd,
    last_processed_height: initialStatus.lastProcessedHeight,
    last_known_height: initialStatus.lastKnownHeight,
  })
  const lag = status.last_known_height! - status.last_processed_height

  const asteroidClient = useAsteroidClient(clientOnly$(true))

  useEffect(() => {
    asteroidClient.statusSubscription(chainId).on(({ status: newStatus }) => {
      if (newStatus[0]) {
        setStatus(newStatus[0])
      }
    })
  }, [asteroidClient, chainId])

  return (
    <footer className="footer fixed left-0 bottom-0 items-center bg-base-200 text-neutral-content border-t border-t-neutral">
      <nav className="grid-flow-col gap-0">
        <div className="flex flex-row uppercase border-r border-r-neutral px-4 py-2">
          <span className="mr-2">Indexer</span>
          {lag <= 1 && <span className="text-success">In Sync</span>}
          {lag > 1 && lag < 5 && <span className="text-success">+{lag}</span>}
          {lag >= 5 && lag < 30 && <span className="text-warning">+{lag}</span>}
          {lag >= 30 && <span className="text-error">+{lag} Lagging</span>}
        </div>
        <div className="flex flex-row h-full items-center border-r border-r-neutral px-4 py-2">
          <Link
            href="https://t.me/asteroidxyz"
            title="Astroid Protocol Telegram Group"
            target="_blank"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 28 24"
              className="fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M21.448 23.735C21.8236 24.0086 22.3078 24.077 22.7394 23.909C23.1711 23.7398 23.4884 23.3606 23.5841 22.901C24.5979 18.0002 27.0572 5.59578 27.98 1.13778C28.05 0.801779 27.9333 0.452578 27.6767 0.228178C27.42 0.00377795 27.0642 -0.0610223 26.7469 0.0601779C21.8551 1.92258 6.79031 7.73659 0.632783 10.0802C0.241959 10.229 -0.0123689 10.6154 0.000464152 11.039C0.0144638 11.4638 0.292124 11.8322 0.692282 11.9558C3.45372 12.8054 7.07847 13.9874 7.07847 13.9874C7.07847 13.9874 8.77243 19.2494 9.65558 21.9254C9.76641 22.2614 10.0219 22.5254 10.3591 22.6166C10.6951 22.7066 11.0544 22.6118 11.3052 22.3682C12.7238 20.9906 14.9171 18.8606 14.9171 18.8606C14.9171 18.8606 19.0844 22.0034 21.448 23.735ZM8.60327 13.3226L10.5621 19.9682L10.9972 15.7598C10.9972 15.7598 18.5652 8.73859 22.8794 4.73658C23.0054 4.61898 23.0229 4.42218 22.9179 4.28418C22.8141 4.14618 22.6228 4.11378 22.4793 4.20738C17.4791 7.49179 8.60327 13.3226 8.60327 13.3226Z"
              />
            </svg>
          </Link>
          <Link
            href="https://twitter.com/asteroidxyz"
            title="Astroid Protocol on X"
            target="_blank"
            className="ml-4"
          >
            <svg
              width="20"
              height="20"
              xmlns="http://www.w3.org/2000/svg"
              className="fill-current"
              viewBox="0 0 120 120"
            >
              <path
                d="M0.3,3.8l46.3,61.9L0,116.2h10.5l40.8-44.1l33,44.1H120L71.1,50.7l43.4-46.9H104L66.4,44.5L36,3.8
      H0.3z M15.7,11.6h16.4l72.4,96.9H88.2L15.7,11.6z"
              />
            </svg>
          </Link>
        </div>
        <div className="flex border-r border-r-neutral px-4 py-2">
          ATOM ${status.base_token_usd}
        </div>
      </nav>
    </footer>
  )
}
