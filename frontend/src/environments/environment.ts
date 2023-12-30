export const environment = {
  production: true,
  domain: 'private-testnet.meteors.app',
  limits: {
    maxFileSize: 770000,
  },
  fees: {
    protocol: {
      receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
      amount: [
        {
          denom: "uatom",
          amount: "10000"
        }
      ]
    },
    chain: {
      gasLimit: "100000000",
      amount: {
        denom: "uatom",
        amount: "10000",
      },
    }
  },
  api: {
    endpoint: 'https://private-testnet-api.meteors.app/v1/graphql',
    explorer: 'https://private-testnet-api.meteors.app/chain/gaia/lcd/cosmos/tx/v1beta1/txs/',
  },
  chain: {
    chainId: "gaialocal-1",
    chainName: "Private Cosmos Hub",
    rpc: "https://private-testnet-api.meteors.app/chain/gaia/rpc",
    rest: "https://private-testnet-api.meteors.app/chain/gaia/lcd",
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
