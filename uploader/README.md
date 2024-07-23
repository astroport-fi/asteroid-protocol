## Development

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