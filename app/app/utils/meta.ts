import { Inscription } from '~/api/inscription'

export function inscriptionMeta(inscription: Inscription) {
  const { name, description, content_path, id, transaction } = inscription
  const title = `${name} Inscription #${id} on Asteroid Protocol`

  return [
    { title },
    {
      property: 'og:url',
      content: `https://asteroidprotocol.io/app/inscription/${transaction.hash}`,
    },
    {
      property: 'og:title',
      content: `${name} Inscription #${id} on Asteroid Protocol`,
    },
    {
      property: 'og:image',
      content: content_path,
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
      content: `https://asteroidprotocol.io/app/inscription/${transaction.hash}`,
    },
    {
      property: 'twitter:title',
      content: `${name} Inscription #${id} on Asteroid Protocol`,
    },
    {
      property: 'twitter:image',
      content: content_path,
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
