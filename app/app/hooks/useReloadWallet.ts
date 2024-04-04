import { useManager } from '@cosmos-kit/react-lite'
import { useNavigate } from '@remix-run/react'
import { useCallback, useEffect } from 'react'
import { clientOnly$ } from 'vite-env-only'
import useAddress from './useAddress'

export default function useReloadWallet() {
  const manager = clientOnly$(useManager())
  const address = useAddress()
  const navigate = useNavigate()
  const refreshCallback = useCallback(() => {
    if (address) {
      navigate(0)
    }
  }, [address, navigate])
  useEffect(() => {
    if (!manager) {
      return
    }
    manager.on('refresh_connection', refreshCallback)

    return () => {
      manager.off('refresh_connection', refreshCallback)
    }
  }, [manager, refreshCallback])
}
