import { useRootContext } from '~/context/root'

export function useCreateAstroportPoolUrl(ticker: string) {
  const { astroportUrl, neutronBridgeContract } = useRootContext()
  return `${astroportUrl}/pools/create?token2=factory/${neutronBridgeContract}/${ticker}`
}

export function useProvideAstroportLiquidityUrl(poolContractAddress: string) {
  const { astroportUrl } = useRootContext()
  return `${astroportUrl}/pools/${poolContractAddress}/provide`
}

export function useSwapAstroportUrl(from: string, to: string) {
  const { astroportUrl } = useRootContext()
  return `${astroportUrl}/swap?from=${from}&to=${to}`
}
