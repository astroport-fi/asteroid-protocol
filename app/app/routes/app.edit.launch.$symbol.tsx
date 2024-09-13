import { Outlet, useLocation } from '@remix-run/react'
import { Tabs } from 'react-daisyui'
import Tab from '~/components/Tab'

enum EditTab {
  Collection,
  LaunchOptions,
  Inscriptions,
}

export default function CreateLaunchpadPage() {
  const location = useLocation()
  const paths = location.pathname.split('/')
  const lastPath = paths[paths.length - 1]
  let active = EditTab.Collection
  if (lastPath === 'inscriptions') {
    active = EditTab.Inscriptions
  } else if (lastPath === 'options') {
    active = EditTab.LaunchOptions
  }

  return (
    <div className="flex flex-col items-center overflow-y-scroll mt-4 no-scrollbar">
      <Tabs
        variant="bordered"
        className="w-full overflow-x-auto shrink-0 no-scrollbar"
      >
        <Tab to="" active={active === EditTab.Collection}>
          Edit collection metadata
        </Tab>
        <Tab to="options" active={active === EditTab.LaunchOptions}>
          Edit launch options
        </Tab>
        <Tab to="inscriptions" active={active === EditTab.Inscriptions}>
          Upload inscriptions
        </Tab>
      </Tabs>
      <div className="w-full overflow-y-scroll flex flex-col items-center justify-center no-scrollbar mt-8">
        <Outlet />
      </div>
    </div>
  )
}
