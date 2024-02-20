import { createContext, useContext } from 'react'

export const RootContext = createContext({
  maxFileSize: 550000,
  txExplorer: '', // @todo add default tx explorer
  asteroidApi: '', // @todo add default asteroid api
  asteroidWs: '', // @todo add default asteroid ws
  chainId: '', // @todo add default chain id
  useIbc: true,
  chainName: '', // @todo add default chain name
  gasPrice: '0.005uatom',
  status: {
    baseToken: '',
    baseTokenUsd: 0,
    lastProcessedHeight: 0,
    lastKnownHeight: 0,
  },
})

export const useRootContext = () => useContext(RootContext)
