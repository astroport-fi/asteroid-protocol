# Asteroid Protocol SDK and command line tool

## Install

```bash
npm i @asteroid-protocol/sdk
```

## SDK

SKD exposes Operations class for each metaprotocol and calling a metaprotocol operation method returns tx data for a given operation

### Operations

- `InscriptionOperations`
  - `inscribe<M = NFTMetadata>(content: Uint8Array, metadata: M, parent?: Parent): TxData`
  - `inscribeCollectionInscription(collection: string, content: Uint8Array, metadata: NFTMetadata): TxData`
  - `inscribeCollection(content: Uint8Array, metadata: CollectionMetadata): TxData`
  - `transfer(hash: string, destination: string): TxData`

- `CFT20Operations`
  - `deploy(data: Uint8Array, mime: string, params: DeployParams): TxData`
  - `mint(ticker: string, amount: number): TxData`
  - `transfer(ticker: string, amount: number, destination: string): TxData`

- `MarketplaceOperations`
  - `listCFT20(ticker: string, amount: number, pricePerToken: number, minDepositPercent: number, timeoutBlocks: number): TxData`
  - `listInscription(hash: string, price: number, minDepositPercent: number, timeoutBlocks: number): TxData`
  - `delist(listingHash: string): TxData`
  - `deposit(listingHash: string): TxData`
  - `buy(listingHash: string, buyType: 'cft20' | 'inscription'): TxData`

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

Simple example: [inscribe.js](https://github.com/astroport-fi/asteroid-protocol/blob/main/client/example/inscribe.js)

How to integrate Asteroid Protocol SDK with Next.js and CosmosKit Wallet provider - https://github.com/astroport-fi/asteroid-sdk-cca-example/

### Asteroid GraphQL Client

```typescript
import { AsteroidService } from "@asteroid-protocol/sdk/client";

const asteroid = new AsteroidService('https://new-api.asteroidprotocol.io/v1/graphql')
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
import { ScalarDefinition, Selector, InputType, GraphQLTypes } from "@asteroid-protocol/sdk/client";

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
  grant
  help [command]  display help for command
```

### Setup account

Create `asteroid.json` file and update `account1` mnemonic to your account

```json
{
    "accounts": {
        "account1": {
            "mnemonic": ""
        }
    }
}
```

### Config file

To customize configuration create `asteroid.json`, see example [here](https://github.com/astroport-fi/asteroid-protocol/blob/main/client/example/asteroid.json)

### Inscription

```bash
Usage: asteroid inscription [options] [command]

Options:
  -h, --help                            display help for command

Commands:
  inscribe [options]                    Create a new inscription
  collection [options]                  Create a new collection
  inscribe-csv [options]                Create inscriptions from Metadata CSV and images
  transfer [options]                    Transfer an inscription
  grant-migration-permission [options]  Grant Migration Permission
  migrate [options]                     Migrate inscriptions
  help [command]                        display help for command
```

#### Inscribe

```bash
Usage: asteroid inscription inscribe [options]

Create a new inscription

Options:
  -n, --network [NETWORK_NAME]     Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]     Name of the account to use as transaction signer
  --granter [GRANTER]              Address of the granter account
  -p, --data-path <DATA_PATH>      Inscription data path
  -i, --name <NAME>                Inscription name
  -d, --description <DESCRIPTION>  Inscription description
  -c, --collection [COLLECTION]    The collection transaction hash
  -h, --help                       display help for command
```

#### Collection

```bash
Usage: asteroid inscription collection [options]

Create a new collection

Options:
  -n, --network [NETWORK_NAME]     Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]     Name of the account to use as transaction signer
  --granter [GRANTER]              Address of the granter account
  -s, --symbol <SYMBOL>            Collection symbol
  -p, --data-path <DATA_PATH>      Inscription data path
  -i, --name <NAME>                Inscription name
  -d, --description <DESCRIPTION>  Inscription description
  -h, --help                       display help for command
```

#### Inscribe CSV

Create multiple standalone inscriptions or add multiple inscriptions to a collection, see example [here](https://github.com/astroport-fi/asteroid-protocol/blob/main/client/example/inscribe-csv)

CSV File format:

| Column Name | Column Description | Example |
|-------------|--------------------|---------|
| name        | The name of the inscription | Rock #1 |
| description | The description of the inscription | White rock in the desert |
| file        | The file name of the image associated with the inscription | 1.jpeg, 1.png, 1.txt, 1.mp4 |
| Name of a trait (body, hair, necklace) | Additional traits or attributes of the inscription |  |

see example [here](https://github.com/astroport-fi/asteroid-protocol/blob/main/client/example/inscribe-csv/metadata.csv)


```bash
Usage: asteroid inscription inscribe-csv [options]

Create inscriptions from Metadata CSV and images/files

Options:
  -n, --network [NETWORK_NAME]          Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]          Name of the account to use as transaction signer
  --granter [GRANTER]                   Address of the granter account
  -p, --csv-path <CSV_PATH>             Metadata CSV path
  -c, --collection [COLLECTION_SYMBOL]  The collection symbol
  -h, --help                            display help for command
```

#### Transfer

```bash
Usage: asteroid inscription transfer [options]

Transfer an inscription

Options:
  -n, --network [NETWORK_NAME]     Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]     Name of the account to use as transaction signer
  --granter [GRANTER]              Address of the granter account
  -h, --hash <HASH>                The transaction hash containing the inscription
  -d, --destination <DESTINATION>  The address to transfer to
  --help                           display help for command
```

#### Migrate

See `migrate.csv` example [here](https://github.com/astroport-fi/asteroid-protocol/blob/main/client/example/migrate.csv)

```bash
Usage: asteroid inscription migrate [options]

Migrate inscriptions

Options:
  -n, --network [NETWORK_NAME]   Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]   Name of the account to use as transaction signer
  --granter [GRANTER]            Address of the granter account
  -p, --csv-path <CSV_PATH>      Metadata CSV path
  -c, --collection <COLLECTION>  The collection transaction hash
  -h, --help                     display help for command
```

#### Grant migration permission

```bash
Usage: asteroid inscription grant-migration-permission [options]

Grant Migration Permission

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -h, --hashes <HASH...>        The transaction hashes containing the inscription(s)
  -g, --grantee <grantee>       The grantee address
  --help                        display help for command
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
  -n, --network [NETWORK_NAME]   Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]   Name of the account to use as transaction signer
  --granter [GRANTER]            Address of the granter account
  -t, --ticker <TICKER>          The address to transfer to
  -i, --name <NAME>              The The name of the token
  -s, --supply <SUPPLY>          The max supply of the token
  -l, --logo-path <LOGO_PATH>    Inscription data path
  -d, --decimals [DECIMALS]      The decimals for the token (default: "6")
  -m, --mint-limit [MINT_LIMIT]  The maximum tokens that can be minted per transaction (default: "1000")
  -h, --help                     display help for command
```

#### Mint

```bash
Usage: asteroid cft20 mint [options]

Mint a token

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -t, --ticker <TICKER>         The address to transfer to
  -m, --amount <AMOUNT>         The amount to transfer
  -h, --help                    display help for command
```

#### Transfer

```bash
Usage: asteroid cft20 transfer [options]

Transfer a token

Options:
  -n, --network [NETWORK_NAME]     Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]     Name of the account to use as transaction signer
  --granter [GRANTER]              Address of the granter account
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
  -n, --network [NETWORK_NAME]     Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]     Name of the account to use as transaction signer
  --granter [GRANTER]              Address of the granter account
  -t, --ticker <TICKER>            The token ticker
  -m, --amount <AMOUNT>            The amount being sold
  -p, --price <PRICE>              The price per token in atom
  -d, --min-deposit [MIN_DEPOSIT]  The minimum deposit expressed as a percentage of total (default: "0.1")
  -b, --timeout-blocks [DECIMALS]  The block this reservation expires (default: "50")
  -h, --help                       display help for command
```

#### List Inscription

```bash
Usage: asteroid marketplace list inscription [options]

Creating a new listing for an inscription

Options:
  -n, --network [NETWORK_NAME]     Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]     Name of the account to use as transaction signer
  --granter [GRANTER]              Address of the granter account
  -t, --hash <HASH>                The transaction hash containing the inscription
  -p, --price <PRICE>              The price in atom
  -d, --min-deposit [MIN_DEPOSIT]  The minimum deposit expressed as a percentage of total (default: "0.1")
  -b, --timeout-blocks [DECIMALS]  The block this reservation expires (default: "50")
  -h, --help                       display help for command
```

#### List All Collection Inscriptions

```bash
Usage: asteroid marketplace list collection [options]

Creating a new listing for all collection inscriptions

Options:
  -n, --network [NETWORK_NAME]          Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]          Name of the account to use as transaction signer
  --granter [GRANTER]                   Address of the granter account
  -c, --collection [COLLECTION_SYMBOL]  The collection symbol
  -p, --price <PRICE>                   The price in atom
  -d, --min-deposit [MIN_DEPOSIT]       The minimum deposit expressed as a percentage of total (default: "0.01")
  -b, --timeout-blocks [DECIMALS]       The block this reservation expires (default: "100")
  -h, --help                            display help for command
```

#### Deposit

```bash
Usage: asteroid marketplace deposit [options]

Reserve a listing for purchase

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```

#### Buy CFT20

```bash
Usage: asteroid marketplace buy cft20 [options]

Buy a listing, the listing must be reserved first

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```

#### Buy Inscription

```bash
Usage: asteroid marketplace buy inscription [options]

Buy a listing, the listing must be reserved first

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```

#### Delist

```bash
Usage: asteroid marketplace delist [options]

Removing a listing

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -h, --hash <HASH>             The listing transaction hash
  --help                        display help for command
```

### Grant

```bash
Usage: asteroid grant [options] [command]

Options:
  -h, --help      display help for command

Commands:
  approve
  help [command]  display help for command
```

#### Grant send message permission

```bash
Usage: asteroid grant approve send [options]

Grant permission to grantee (for example bot) to perform send message on behalf of granter (user)

Options:
  -n, --network [NETWORK_NAME]  Name of the network to use (default: "local")
  -a, --account [ACCOUNT_NAME]  Name of the account to use as transaction signer
  --granter [GRANTER]           Address of the granter account
  -g, --grantee <GRANTEE>       The grantee address
  -m, --amount <AMOUNT>         The granted amount in uatom
  -h, --help                    display help for command
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

npx asteroid inscription collection -p ./example/inscribe-csv/logo.png --name Rocks --description Rocks --symbol ROCK
npx asteroid inscription inscribe-csv -c DEAC410DF14EE4F7B0D74D5CA34B1DC3FD210F9CD039B917AF4311BA4976626D -p ./example/inscribe-csv/metadata.csv

npx asteroid inscription grant-migration-permission -g $granteeAddress -h $inscription1Hash -h $inscription2Hash -h $inscriptionXHash
npx asteroid inscription migrate -p ./migration.csv -c $collectionHash

```

#### Inscribe on behalf of user by a bot or backend

1. Grant permission to send 5 uatom - it will allow bot to create 5 inscription inscribe transactions

```bash
npx asteroid grant approve send --grantee cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw --amount 5
```

2. Inscribe inscriptions on behalf of user by a bot

```bash
npx asteroid inscription inscribe --granter cosmos1m9l358xunhhwds0568za49mzhvuxx9uxre5tud -p ~/Downloads/test.png --account bot --name "test inscription" -d "test description"
```

## Development

see [DEV.mod](./DEV.md)