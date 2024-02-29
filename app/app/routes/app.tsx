import { Outlet, useLocation } from '@remix-run/react'
import clsx from 'clsx'
import Footer from '~/components/Footer'
import Navbar from '~/components/Navbar'

export default function App() {
  const location = useLocation()
  const padding = location.pathname !== '/app/inscriptions'

  return (
    <div>
      <Navbar />
      <div
        className={clsx('mt-16 h-[calc(100vh-6rem)]', {
          ['px-16 py-8']: padding,
        })}
      >
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
