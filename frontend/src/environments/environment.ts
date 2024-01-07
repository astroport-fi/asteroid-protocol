// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  domain: 'localhost:8100',
  limits: {
    maxFileSize: 770000,
  },
  storage: {
    connectedWallet: "connectedWallet"
  },
  fees: {
    protocol: {
      inscription: {
        inscribe: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "5000"
        },
      },
      cft20: {
        deploy: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "2000"
        },
        mint: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "1000"
        },
        transfer: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "1000"
        },
        list: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "1000"
        },
        buy: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "1000"
        },
        delist: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "1000"
        },
      },
    },
    chain: {
      gasLimit: "12000000"
    }
  },
  api: {
    // endpoint: 'http://192.168.11.103:8080/v1/graphql',
    // explorer: 'http://192.168.11.103:8665/chain/gaia/lcd/cosmos/tx/v1beta1/txs/',
    endpoint: 'http://localhost:8080/v1/graphql',
    explorer: 'http://localhost:8665/chain/gaia/lcd/cosmos/tx/v1beta1/txs/',
  },
  chain: {
    chainId: "gaialocal-1",
    chainName: "Private Cosmos Hub",
    // rpc: "http://192.168.11.103:8665/chain/gaia/rpc",
    // rest: "http://192.168.11.103:8665/chain/gaia/lcd",
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
      gasPriceStep: { low: 0.005, average: 0.005, high: 0.008 }
    }],
    stakeCurrency: {
      coinDenom: 'atom',
      coinMinimalDenom: 'uatom',
      coinDecimals: 6
    },
  },

};
