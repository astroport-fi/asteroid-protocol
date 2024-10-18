import { Outlet, useNavigation } from '@remix-run/react'
import { Navbar, Progress } from 'react-daisyui'
import { Bounce, ToastContainer } from 'react-toastify'
import { DesktopMenu, MobileMenu } from '~/components/Menu'
import { Wallet } from '~/components/wallet/Wallet'
import 'react-toastify/dist/ReactToastify.css'
import logoHorizontal from '~/images/logo/logo-horizontal.svg'
import logoVertical from '~/images/logo/logo-vertical.svg'

export default function App() {
  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  return (
    <div className="flex flex-col items-center">
      {isLoading ? (
        <Progress
          className="w-full rounded-none h-1 border-none shadow-none"
          color="primary"
        />
      ) : null}
      <div className="flex w-full max-w-6xl justify-center mt-8 ">
        <div className="mr-8 hidden lg:flex">
          <img src={logoVertical} alt="logo" className="h-80 w-32" />
        </div>
        <DesktopMenu />
        <Navbar className="absolute left-0 top-0 lg:hidden p-0 border-b border-b-neutral">
          <Navbar.Start className="flex">
            <MobileMenu />
            <img src={logoHorizontal} alt="logo" className="w-32 ml-4 mt-2" />
          </Navbar.Start>
          <Navbar.End className="pr-4">
            <Wallet />
          </Navbar.End>
        </Navbar>
        <div className="flex flex-col items-center w-full lg:px-8 px-4 mt-8 lg:mt-0">
          <Outlet />
        </div>
        <Wallet className="ml-8 hidden lg:flex" />
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        pauseOnHover
        pauseOnFocusLoss
        theme="light"
        transition={Bounce}
      />
    </div>
  )
}
