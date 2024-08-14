import { Link, Outlet, useLocation } from '@remix-run/react'
import { Steps } from 'react-daisyui'

enum LaunchpadStep {
  Collection,
  Launch,
  Inscriptions,
}

export default function CreateLaunchpadPage() {
  const location = useLocation()
  const paths = location.pathname.split('/')
  const lastPath = paths[paths.length - 1]
  let active = LaunchpadStep.Launch
  if (lastPath === 'inscriptions') {
    active = LaunchpadStep.Inscriptions
  } else if (lastPath === 'collection') {
    active = LaunchpadStep.Collection
  }

  return (
    <div className="flex flex-col items-center overflow-y-scroll mt-4 no-scrollbar">
      <Steps className="w-full overflow-x-auto shrink-0 no-scrollbar mb-4">
        <Steps.Step color="primary">
          <Link to="/app/create/launch/collection">Create collection</Link>
        </Steps.Step>
        <Steps.Step
          color={active >= LaunchpadStep.Launch ? 'primary' : undefined}
        >
          <Link to="/app/create/launch">Set launch options</Link>
        </Steps.Step>
        <Steps.Step
          color={active === LaunchpadStep.Inscriptions ? 'primary' : undefined}
        >
          <Link to="/app/create/launch/inscriptions">Upload inscriptions</Link>
        </Steps.Step>
      </Steps>
      <div className="w-full pb-8 overflow-y-scroll flex flex-col items-center justify-center no-scrollbar">
        <Outlet />
      </div>
    </div>
  )
}
