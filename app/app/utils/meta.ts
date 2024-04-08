import { CollectionDetail } from '~/api/collection'
import { Inscription } from '~/api/inscription'
import { Token } from '~/api/token'

function genericMeta(
  title: string,
  description: string,
  contentPath: string,
  url: string,
) {
  return [
    { title },
    {
      property: 'og:url',
      content: url,
    },
    {
      property: 'og:title',
      content: title,
    },
    {
      property: 'og:image',
      content: contentPath,
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      name: 'description',
      content: description,
    },
    {
      property: 'twitter:url',
      content: url,
    },
    {
      property: 'twitter:title',
      content: title,
    },
    {
      property: 'twitter:image',
      content: contentPath,
    },
    {
      property: 'twitter:description',
      content: description,
    },
    {
      property: 'twitter:card',
      content: 'summary',
    },
  ]
}

export function inscriptionMeta(inscription: Inscription) {
  const { name, description, content_path, inscription_number, transaction } =
    inscription
  const title = `${name} Inscription #${inscription_number} on Asteroid Protocol`
  const url = `https://asteroidprotocol.io/app/inscription/${transaction.hash}`
  return genericMeta(title, description, content_path, url)
}

export function collectionMeta(collection: CollectionDetail) {
  const {
    name,
    metadata: { description },
    content_path,
    symbol,
  } = collection
  const title = `${name} Collection on Asteroid Protocol`
  const url = `https://asteroidprotocol.io/app/collection/${symbol}`
  return genericMeta(title, description, content_path!, url)
}

export function tokenMeta(token: Token) {
  const { name, ticker, content_path, id } = token
  const title = `${ticker} | ${name} | on Asteroid Protocol`
  const url = `https://asteroidprotocol.io/app/token/${ticker}`
  const description = `${ticker} | CFT-20 Token #${id} on Asteroid Protocol`

  return genericMeta(title, description, content_path!, url)
}

export function mintTokenMeta(token: Token) {
  const { name, ticker, content_path, id } = token
  const title = `${ticker} | ${name} | on Asteroid Protocol`
  const url = `https://asteroidprotocol.io/mint/${ticker}`
  const description = `Mint ${ticker} | CFT-20 Token #${id} on Asteroid Protocol`

  return genericMeta(title, description, content_path!, url)
}
