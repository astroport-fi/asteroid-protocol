# Asteroid Protocol SDK and command line tool

## Install

```bash
npm i @asteroid-protocol/sdk
```

## SDK

SKD exposes Operations class for each metaprotocol and calling a metaprotocol operation method returns tx data for a given operation

### Operations

- `InscriptionOperations`
  - `inscribe(data: string | Buffer, metadata: ContentInscription): TxData`
  - `transfer(hash: string, destination: string): TxData`

- `CFT20Operations`
  - `deploy(data: string | Buffer, mime: string, params: DeployParams): TxData`
  - `mint(ticker: string, amount: number): TxData`
  - `transfer(ticker: string, amount: number, destination: string): TxData`

- `MarketplaceOperations`
  - `listCFT20(ticker: string, amount: number, pricePerToken: number, minDepositPercent: number, timeoutBlocks: number): TxData`
  - `delist(listingHash: string): TxData`
  - `deposit(listingHash: string): TxData`
  - `buyCFT20(listingHash: string): TxData`

### Tx Data interface

```typescript
interface TxData {
  memo: string
  messages: readonly EncodeObject[]
  nonCriticalExtensionOptions: Any[]
}
```

### Example

```typescript
import { InscriptionOperations } from "@asteroid-protocol/sdk";

const operations = new InscriptionOperations(
  network.chainId,
  account.address
);

const data = "SOME DATA";
const txData = operations.inscribe(data, {
  mime: "text/plain",
  name: "some text",
  description: "some text description",
});
```

Once you have `txData` you have to sign it and broadcast to the chain.

Asteroid SDK provides custom `SigningStargateClient` with `nonCriticalExtensionOptions` support that Asteroid Protocol uses

```typescript
import { SigningStargateClient } from "@asteroid-protocol/sdk";

const client = await SigningStargateClient.connectWithSigner(
  network.rpc,
  signer,
  { gasPrice: GasPrice.fromString(network.gasPrice) },
)

// broadcast tx
const res = await client.signAndBroadcast(
  account.address,
  txData.messages,
  'auto',
  txData.memo,
  undefined,
  txData.nonCriticalExtensionOptions,
)
```

Simple example: [inscribe.js](https://github.com/astroport-fi/asteroid-protocol/blob/feat/client/client/example/inscribe.js)

How to integrate Asteroid Protocol SDK with Next.js and CosmosKit Wallet provider - https://github.com/astroport-fi/asteroid-sdk-cca-example/

### Asteroid GraphQL Client

```typescript
import { AsteroidService } from "@asteroid-protocol/sdk";

const asteroid = new AsteroidService('https://api.asteroidprotocol.io/v1/graphql')
const tokens = await asteroid.query({
  token: [
    { limit: 20 },
    {
      id: true,
      name: true,
      ticker: true,
      max_supply: true,
      circulating_supply: true,
    },
  ],
})
```

If you want to infer the response type then you can update previous example to be more reusable

```typescript
import { ScalarDefinition, Selector, InputType, GraphQLTypes } from "@asteroid-protocol/sdk";

const tokenSelector = Selector('token')({
  id: true,
  name: true,
  ticker: true,
  max_supply: true,
  circulating_supply: true,
})

export type Token = InputType<
  GraphQLTypes['token'],
  typeof tokenSelector,
  ScalarDefinition
>

const tokens = await asteroid.query({
  token: [
    { limit: 20 },
    tokenSelector,
  ],
})
```

## Command line tool

Run `npx asteroid`

```bash
Usage: asteroid [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  inscription
  cft20
  marketplace
  help [command]  display help for command
```

### Config file

To customize configuration create `asteroid.json`, see example [here](https://github.com/astroport-fi/asteroid-protocol/blob/feat/client/client/asteroid.json)

### Inscription

```bash
Usage: asteroid inscription [options] [command]

Options:
  -h, --help          display help for command

Commands:
  inscribe [options]  Create a new inscription
  transfer [options]  Transfer an inscription
  help [command]      display help for command
```

#### Inscribe

```bash
Usage: asteroid inscription inscribe [options]

Create a new inscription

Options:
  -n, --network <NETWORK_NAME>     Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>     Name of the account to use as transaction signer
  -p, --data-path <DATA_PATH>      Inscription data path
  -i, --name <NAME>                Inscription name
  -d, --description <DESCRIPTION>  Inscription description
  -h, --help                       display help for command
```

#### Transfer

```bash
Usage: asteroid inscription transfer [options]

Transfer an inscription

Options:
  -n, --network <NETWORK_NAME>     Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>     Name of the account to use as transaction signer
  -h, --hash <HASH>                The transaction hash containing the inscription
  -d, --destination <DESTINATION>  The address to transfer to
  --help                           display help for command
```

### CFT-20

```bash
Usage: asteroid cft20 [options] [command]

Options:
  -h, --help          display help for command

Commands:
  deploy [options]    Create a new token
  mint [options]      Mint a token
  transfer [options]  Transfer a token
  help [command]      display help for command
```

#### Deploy

```bash
Usage: asteroid cft20 deploy [options]

Create a new token

Options:
  -n, --network <NETWORK_NAME>   Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>   Name of the account to use as transaction signer
  -t, --ticker <TICKER>          The address to transfer to
  -i, --name <NAME>              The The name of the token
  -s, --supply <SUPPLY>          The max supply of the token
  -l, --logo-path <LOGO_PATH>    Inscription data path
  -d, --decimals <DECIMALS>      The decimals for the token (default: "6")
  -m, --mint-limit <MINT_LIMIT>  The maximum tokens that can be minted per transaction (default: "1000")
  -h, --help                     display help for command
```

#### Mint

```bash
Usage: asteroid cft20 mint [options]

Mint a token

Options:
  -n, --network <NETWORK_NAME>  Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>  Name of the account to use as transaction signer
  -t, --ticker <TICKER>         The address to transfer to
  -m, --amount <AMOUNT>         The amount to transfer
  -h, --help                    display help for command
```

#### Transfer

```bash
Usage: asteroid cft20 transfer [options]

Transfer a token

Options:
  -n, --network <NETWORK_NAME>     Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>     Name of the account to use as transaction signer
  -t, --ticker <TICKER>            The token ticker
  -m, --amount <AMOUNT>            The amount to transfer
  -d, --destination <DESTINATION>  The address to transfer to
  -h, --help                       display help for command
```

### Marketplace

```bash
Usage: asteroid marketplace [options] [command]

Options:
  -h, --help         display help for command

Commands:
  list
  deposit [options]  Reserve a listing for purchase
  buy
  delist [options]   Removing a listing
  help [command]     display help for command
```

#### List CFT20

```bash
Usage: asteroid marketplace list cft20 [options]

Creating a new listing for CFT-20 tokens

Options:
  -n, --network <NETWORK_NAME>     Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>     Name of the account to use as transaction signer
  -t, --ticker <TICKER>            The token ticker
  -m, --amount <AMOUNT>            The amount being sold
  -p, --price <PRICE>              The price per token in atom
  -d, --min-deposit <MIN_DEPOSIT>  The minimum deposit expressed as a percentage of total (default: "10")
  -b, --timeout-blocks <DECIMALS>  The block this reservation expires (default: "50")
  -h, --help                       display help for command
```

#### Deposit

```bash
Usage: asteroid marketplace deposit [options]

Reserve a listing for purchase

Options:
  -n, --network <NETWORK_NAME>  Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>  Name of the account to use as transaction signer
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```

#### Buy CFT20

```bash
Usage: asteroid marketplace buy cft20 [options]

Buy a listing, the listing must be reserved first

Options:
  -n, --network <NETWORK_NAME>  Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>  Name of the account to use as transaction signer
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```

#### Delist

```bash
Usage: asteroid marketplace delist [options]

Removing a listing

Options:
  -n, --network <NETWORK_NAME>  Name of the network to use (default: "local")
  -a, --account <ACCOUNT_NAME>  Name of the account to use as transaction signer
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```


### Examples

```
npx asteroid inscription inscribe -p ~/Downloads/roids.png  --name asteroid --description asteroid
npx asteroid inscription transfer -h 7105307B313A509C67CF1C146576E881E4B20FBA487A31F8F0145BEACDDF9B73 -d cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw

npx asteroid cft20 deploy --ticker ROIDS --name ROIDS --supply 1000000 --logo-path ~/Downloads/roids.png
npx asteroid cft20 mint --ticker ROIDS --amount 1000
npx asteroid cft20 transfer --ticker ROIDS --amount 500 -d cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw

npx asteroid marketplace list cft20 --ticker ROIDS --amount 10 --price 0.1
npx asteroid marketplace deposit --hash 4C79CA69034AB97A49581E56FDE376E10D9FFB3E71567C0462A3729DA1B04E60
npx asteroid marketplace buy cft20 --hash 4C79CA69034AB97A49581E56FDE376E10D9FFB3E71567C0462A3729DA1B04E60
```

## Development

```bash
npx ts-node src/cli.ts
```
