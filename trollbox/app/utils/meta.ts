import { TrollPost } from '~/api/trollbox'

function genericMeta(
  title: string,
  description: string,
  url: string,
  contentPath: string = 'https://trollbox.app/trollbox.png',
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

export function postMeta(post: TrollPost) {
  const { id, text } = post
  const title = `Trollpost #${id} | on Trollbox`
  const url = `https://trollbox.app/post/${id}`
  return genericMeta(title, text, url)
}
