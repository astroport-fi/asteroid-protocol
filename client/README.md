# Asteroid Protocol js library and command line tool

## Command line tool

```bash
Usage: asteroid [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  inscription
  cft20
  help [command]  display help for command
```

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
