export function getDenom(contractAddress: string, ticker: string) {
  return `factory/${contractAddress}/${ticker}`
}
