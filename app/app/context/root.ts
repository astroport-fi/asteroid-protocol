import { createContext, useContext } from 'react'

export const RootContext = createContext({
  maxFileSize: 550000,
  restEndpoint: '',
  rpcEndpoint: '',
  txExplorer: '',
  asteroidApi: '',
  asteroidWs: '',
  uploadApi: '',
  minterAddress: '',
  chainId: '',
  neutronChainId: '',
  neutronChainName: '',
  neutronRpcEndpoint: '',
  neutronRestEndpoint: '',
  neutronBridgeContract: '',
  astroportFactoryContract: '',
  astroportUrl: '',
  bridgeEndpoints: [] as string[],
  useIbc: true,
  useExtensionData: true,
  chainName: '',
  gasPrice: '0.005uatom',
  status: {
    baseToken: '',
    baseTokenUsd: 0,
    lastProcessedHeight: 0,
    lastKnownHeight: 0,
  },
})

export const useRootContext = () => useContext(RootContext)
