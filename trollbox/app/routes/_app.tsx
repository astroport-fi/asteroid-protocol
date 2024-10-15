import { Outlet, useNavigation } from '@remix-run/react'
import { Progress } from 'react-daisyui'
import Menu from '~/components/Menu'
import { Wallet } from '~/components/wallet/Wallet'

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
      <div className="flex w-full max-w-6xl justify-center mt-8">
        <Menu />
        <div className="flex flex-col items-center w-full px-8">
          <Outlet />
        </div>
        <Wallet className="ml-8" />
      </div>
    </div>
  )
}
