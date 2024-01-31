## Asteroid API

Based on [Hasura GraphQL Engine](https://github.com/hasura/graphql-engine)

## Development

You need to install [Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/) first

### Apply Hasura Metadata on a database

```bash
hasura metadata apply
```

### Export Hasura GraphQL Engine Metadata from the database

```bash
hasura metadata export
```

### Reload Hasura GraphQL Engine schema to pick up changes in any underlying data sources (database)

```bash
hasura metadata reload
```
