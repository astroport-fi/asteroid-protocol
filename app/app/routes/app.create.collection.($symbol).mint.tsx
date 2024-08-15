import { Outlet, useLocation } from '@remix-run/react'
import { Steps } from 'react-daisyui'
import { Link } from 'react-router-dom'

enum Step {
  CreateCollection,
  MintInscriptions,
}

export default function CollectionMintBase() {
  const location = useLocation()
  const paths = location.pathname.split('/')
  const lastPath = paths[paths.length - 1]
  let active = Step.CreateCollection
  if (lastPath === 'inscriptions') {
    active = Step.MintInscriptions
  }

  return (
    <div className="flex flex-col items-center overflow-y-scroll mt-4 no-scrollbar">
      <Steps className="w-full overflow-x-auto shrink-0 no-scrollbar mb-4">
        <Steps.Step color="primary">
          <Link to="/app/create/collection/mint">Create collection</Link>
        </Steps.Step>
        <Steps.Step
          color={active === Step.MintInscriptions ? 'primary' : undefined}
        >
          <Link to="/app/create/collection/mint/inscriptions">
            Mint inscriptions
          </Link>
        </Steps.Step>
      </Steps>
      <div className="w-full px-8 pb-8 overflow-y-scroll">
        <Outlet />
      </div>
    </div>
  )
}
