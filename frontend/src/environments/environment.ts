// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,

  api: {
    endpoint: 'http://localhost:8080',
  },
  chain: {
    chainId: "gaialocal-1",
    chainName: "Private Cosmos Hub",
    rpc: "http://localhost:8665/chain/gaia/rpc",
    rest: "http://localhost:8665/chain/gaia/lcd",
    bip44: {
      coinType: 118
    },
    bech32Config: {
      bech32PrefixAccAddr: 'cosmos',
      bech32PrefixAccPub: 'cosmospub',
      bech32PrefixValAddr: 'cosmosval',
      bech32PrefixValPub: 'cosmosvalpub',
      bech32PrefixConsAddr: 'cosmosvalcons',
      bech32PrefixConsPub: 'cosmosvalconsconspub'
    },
    currencies: [{
      coinDenom: 'atom',
      coinMinimalDenom: 'uatom',
      coinDecimals: 6
    }],
    feeCurrencies: [{
      coinDenom: 'stake',
      coinMinimalDenom: 'stake',
      coinDecimals: 6,
      gasPriceStep: { low: 0.01, average: 0.025, high: 0.04 }
    }],
    stakeCurrency: {
      coinDenom: 'atom',
      coinMinimalDenom: 'uatom',
      coinDecimals: 6
    },
  },

};
