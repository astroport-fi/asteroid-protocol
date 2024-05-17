export function getSupplyTitle(value: number) {
  if (value >= 1000000000000) {
    return (value / 1000000000000).toFixed(4) + ' T'
  } else if (value >= 1000000000) {
    return (value / 1000000).toFixed(4) + ' M'
  } else if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + ' M'
  } else if (value >= 100000) {
    return (value / 100000).toFixed(6) + 'k'
  } else {
    return value.toString()
  }
}

export function getDecimalValue(value: number, decimals: number) {
  return value / Math.pow(10, decimals)
}

export function toDecimalValue(value: number, decimals: number) {
  return value * Math.pow(10, decimals)
}
