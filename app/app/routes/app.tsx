import { Outlet, useLocation, useNavigation } from '@remix-run/react'
import clsx from 'clsx'
import { Progress } from 'react-daisyui'
import Footer from '~/components/Footer'
import Navbar from '~/components/Navbar'

export default function App() {
  const location = useLocation()
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'
  const padding =
    !location.pathname.includes('/app/inscriptions/') &&
    !location.pathname.includes('/app/market') &&
    !location.pathname.includes('/app/collection/')

  const center =
    location.pathname === '/app/inscriptions' ||
    location.pathname === '/app/collections'

  return (
    <div className="flex flex-col bg-main-gradient">
      <Navbar />
      {isLoading ? (
        <Progress
          className="w-full rounded-none h-1 border-none shadow-none mt-16"
          color="primary"
        />
      ) : null}
      <div
        className={clsx('flex flex-col h-[calc(100svh-6.5rem)]', {
          'mt-16': !isLoading,
          'px-8 lg:px-16 py-4 lg:py-8 overflow-y-scroll': padding,
          'items-center': center,
        })}
      >
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
