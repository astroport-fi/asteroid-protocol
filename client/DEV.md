# DEV

## Run CLI

```bash
npx ts-node src/cli.ts
```

## Deploy to NPM

1. Bump version

    ```bash
    npm version patch
    ```

2. Deploy
    
    ```bash
    npm run deploy
    ```

### Prerelease version

1. Bump version

    ```bash
    npm version prerelease --preid $TAG
    ```

2. Deploy
    
    ```bash
    npm publish --access public --tag $TAG
    ```