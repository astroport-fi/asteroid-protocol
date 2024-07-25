import { Outlet, useLocation } from '@remix-run/react'
import { Tabs } from 'react-daisyui'
import Tab from '~/components/Tab'

enum LaunchpadTab {
  Collection,
  Launch,
  Inscriptions,
}

export default function CreateLaunchpadPage() {
  const location = useLocation()
  const paths = location.pathname.split('/')
  const lastPath = paths[paths.length - 1]
  let active = LaunchpadTab.Launch
  if (lastPath === 'inscriptions') {
    active = LaunchpadTab.Inscriptions
  } else if (lastPath === 'collection') {
    active = LaunchpadTab.Collection
  }

  return (
    <div className="flex flex-col items-center overflow-y-scroll mt-4">
      <Tabs
        variant="bordered"
        className="w-full overflow-x-auto shrink-0 no-scrollbar mb-4"
      >
        <Tab to="collection" active={active === LaunchpadTab.Collection}>
          Collection
        </Tab>
        <Tab to="" active={active === LaunchpadTab.Launch}>
          Launchpad
        </Tab>
        <Tab to="inscriptions" active={active === LaunchpadTab.Inscriptions}>
          Inscriptions
        </Tab>
      </Tabs>
      <div className="w-full px-8 pb-8 overflow-y-scroll">
        <Outlet />
      </div>
    </div>
  )
}
