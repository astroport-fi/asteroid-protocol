# Cosmos Inscriptions Indexer

This is a reference implementation to index inscription data. 

TODO: Complete description and why this is needed
TODO: Not the most efficient, heavily commented to explain the process

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
2. Run `make create-migration`

### Apply migration(s)

```bash
atlas migrate apply --env local
```
