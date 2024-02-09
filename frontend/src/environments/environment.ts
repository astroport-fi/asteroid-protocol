export const environment = {
  production: false,
  domain: 'localhost:8100',
  limits: {
    maxFileSize: 550000,
  },
  storage: {
    connectedWalletKey: 'connectedWallet',
  },
  swap: {
    defaultToken: 'ROIDS',
  },
  fees: {
    ibcChannel: 'channel-569',
    protocol: {
      inscription: {
        inscribe: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
        },
        transfer: {
          receiver: '',
          denom: 'uatom',
          amount: '0',
        },
      },
      cft20: {
        deploy: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
        },
        mint: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
        },
        transfer: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
        },
        list: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
          minTradeSize: 0.000001,
        },
        buy: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0.02', // Default 2%
          type: 'dynamic-percent',
        },
        reserve: {
          receiver: '',
          denom: 'uatom',
          amount: '0',
        },
        delist: {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
        },
      },
      marketplace: {
        'list.cft20': {
          receiver: 'cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv',
          denom: 'uatom',
          amount: '0',
          minTradeSize: 0.000001,
          minDepositAbsolute: 0.000001,
          minDepositPercent: 0.1,
          maxDepositPercent: 1,
          minTimeout: 50,
          maxTimeout: 500,
        },
      },
    },
    chain: {
      gasLimit: '12000000',
      minFee: '0',
    },
  },
  api: {
    endpoint: 'http://127.0.0.1:8080/v1/graphql',
    explorer: 'http://127.0.0.1:8665/chain/gaia/lcd/cosmos/tx/v1beta1/txs/',
    wss: 'ws://127.0.0.1:8080/v1/graphql',
    simulateEndpoint: 'http://127.0.0.1:8665/chain/gaia/lcd',
    stargazeNameEndpoint:
      'https://rest.stargaze-apis.com/cosmwasm/wasm/v1/contract/stars1fx74nkqkw2748av8j7ew7r3xt9cgjqduwn8m0ur5lhe49uhlsasszc5fhr/smart/',
  },
  chain: {
    chainId: 'gaialocal-1',
    chainName: 'Private Cosmos Hub',
    rpc: 'http://127.0.0.1:8665/chain/gaia/rpc',
    rest: 'http://127.0.0.1:8665/chain/gaia/lcd',
    bip44: {
      coinType: 118,
    },
    bech32Config: {
      bech32PrefixAccAddr: 'cosmos',
      bech32PrefixAccPub: 'cosmospub',
      bech32PrefixValAddr: 'cosmosval',
      bech32PrefixValPub: 'cosmosvalpub',
      bech32PrefixConsAddr: 'cosmosvalcons',
      bech32PrefixConsPub: 'cosmosvalconsconspub',
    },
    currencies: [
      {
        coinDenom: 'ATOM',
        coinMinimalDenom: 'uatom',
        coinDecimals: 6,
        coinGeckoId: 'cosmos',
      },
    ],
    feeCurrencies: [
      {
        coinDenom: 'STAKE',
        coinMinimalDenom: 'stake',
        coinDecimals: 6,
        coinGeckoId: 'cosmos',
        gasPriceStep: {
          low: 0.005,
          average: 0.005,
          high: 0.005,
        },
      },
    ],
    stakeCurrency: {
      coinDenom: 'ATOM',
      coinMinimalDenom: 'uatom',
      coinDecimals: 6,
      coinGeckoId: 'cosmos',
    },
  },
};
