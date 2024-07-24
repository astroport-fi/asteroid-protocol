## Development

### Gaiad commands to test out logic

#### Create grant

```bash
gaiad tx authz grant cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw send --spend-limit=100860uatom --from cosmos14xcrdjwwxtf9zr7dvaa97wy056se6r5e8q68mw --node http://localhost:16657 --chain-id gaialocal-1 --from test3 --fees=500uatom
```

#### Query grant

```bash
gaiad query authz grants cosmos14xcrdjwwxtf9zr7dvaa97wy056se6r5e8q68mw cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw /cosmos.bank.v1beta1.MsgSend --node http://localhost:16657
```

#### Revoke grant

```bash
gaiad tx authz revoke cosmos10h9stc5v6ntgeygf5xf945njqq5h32r53uquvw /cosmos.bank.v1beta1.MsgSend --from cosmos14xcrdjwwxtf9zr7dvaa97wy056se6r5e8q68mw --node http://localhost:16657 --chain-id gaialocal-1 --from test3 --fees=500uatom
```

## DB Migrations

You need to install [Atlas CLI](https://atlasgo.io/) first

```bash
curl -sSf https://atlasgo.sh | sh
```

### Guides

- Getting started - https://atlasgo.io/getting-started/
- Upgrading our production database to use versioned migrations - https://entgo.io/docs/versioned/upgrade-prod/

### Create a migration

1. Update `schema.sql`
2. Run `npm run create-migration`

### Apply migration(s)

```bash
npm run apply-migration
```

If you are running migration for first time, but on existing database there is a optional `--baseline` version argument. Atlas will mark this version as already applied and proceed with the next version after it.