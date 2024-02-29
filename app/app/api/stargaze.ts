const STARGAZE_ENDPOINT =
  'https://rest.stargaze-apis.com/cosmwasm/wasm/v1/contract/stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr/smart/'

export async function getStargazeName(address: string) {
  const query = {
    name: { address },
  }
  const queryBase64 = btoa(JSON.stringify(query))
  try {
    const response = await fetch(`${STARGAZE_ENDPOINT}${queryBase64}`)
    const responseData = await response.json<{ data: string }>()
    if (responseData.data) {
      return `${responseData.data}.cosmos`
    }
    return null
  } catch (err) {
    return null
  }
}
