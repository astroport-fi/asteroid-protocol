export const environment = {
  production: true,
  domain: 'testnet.asteroidprotocol.io',
  limits: {
    maxFileSize: 740000,
  },
  storage: {
    connectedWalletKey: "connectedWallet"
  },
  fees: {
    protocol: {
      inscription: {
        inscribe: {
          receiver: "",
          denom: "uatom",
          amount: "0"
        },
        transfer: {
          receiver: "",
          denom: "uatom",
          amount: "0"
        },
      },
      cft20: {
        deploy: {
          receiver: "",
          denom: "uatom",
          amount: "0"
        },
        mint: {
          receiver: "",
          denom: "uatom",
          amount: "0"
        },
        transfer: {
          receiver: "",
          denom: "uatom",
          amount: "0"
        },
        list: {
          receiver: "",
          denom: "uatom",
          amount: "0",
          minTradeSize: 0.000001,
        },
        buy: {
          receiver: "cosmos1y6338yfh4syssaglcgh3ved9fxhfn0jk4v8qtv",
          denom: "uatom",
          amount: "0.02", // Default 2%
          type: "dynamic-percent"
        },
        delist: {
          receiver: "",
          denom: "uatom",
          amount: "0"
        },
      },
    },
    chain: {
      gasLimit: "12000000"
    }
  },
  api: {
    endpoint: 'http://192.168.11.103:8080/v1/graphql',
    wss: 'ws://192.168.11.103:8080/v1/graphql',
    explorer: 'http://192.168.11.103:8665/chain/gaia/lcd/cosmos/tx/v1beta1/txs/',
    simulateEndpoint: "http://192.168.11.103:8665/chain/gaia/lcd"
  },
  chain: {
    chainId: "gaialocal-1",
    chainName: "Private Cosmos Hub",
    rpc: "http://192.168.11.103:8665/chain/gaia/rpc",
    rest: "http://192.168.11.103:8665/chain/gaia/lcd",
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
    currencies: [
      {
        coinDenom: "ATOM",
        coinMinimalDenom: "uatom",
        coinDecimals: 6,
        coinGeckoId: "cosmos",
      },
    ],
    feeCurrencies: [
      {
        coinDenom: "STAKE",
        coinMinimalDenom: "stake",
        coinDecimals: 6,
        coinGeckoId: "cosmos",
        gasPriceStep: {
          low: 0.005,
          average: 0.005,
          high: 0.005,
        },
      },
    ],
    stakeCurrency: {
      coinDenom: "ATOM",
      coinMinimalDenom: "uatom",
      coinDecimals: 6,
      coinGeckoId: "cosmos",
    },
  },
};
