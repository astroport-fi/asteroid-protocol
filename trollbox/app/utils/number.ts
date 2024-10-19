export function getSupplyTitle(value: number) {
  const digits = 3
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ]
  const reversedLookup = lookup.slice().reverse()
  const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/
  const item = reversedLookup.find((item) => value >= item.value)
  return item
    ? (value / item.value)
        .toFixed(digits)
        .replace(regexp, '')
        .concat(item.symbol)
    : '0'
}

export function getDecimalValue(value: number, decimals: number) {
  return value / Math.pow(10, decimals)
}

export function toDecimalValue(value: number, decimals: number) {
  return value * Math.pow(10, decimals)
}
