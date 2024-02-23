import { CloudArrowDownIcon, LinkIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Link as DaisyLink } from 'react-daisyui'
import Markdown from 'react-markdown'
import InscriptionImage from '~/components/InscriptionImage'
import { AsteroidService, Inscription } from '~/services/asteroid'
import { getMimeTitle } from '~/utils/string'

export async function loader({ context, params }: LoaderFunctionArgs) {
  const asteroidService = new AsteroidService(context.env.ASTEROID_API)

  if (!params.hash) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const inscription = await asteroidService.getInscription(params.hash)

  if (!inscription) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  return json({ inscription })
}

function RemoteMarkdown({ src, isJson }: { src: string; isJson?: boolean }) {
  const [data, setData] = useState<string | null>(null)
  useEffect(() => {
    fetch(src)
      .then((res) => res.text())
      .then((data) => {
        if (isJson) {
          setData(`\`\`\`json\n${data}\n\`\`\``)
        } else {
          setData(data)
        }
      })
  }, [src, isJson])

  // @todo add loader

  return (
    <Markdown className="prose bg-base-200 p-8 rounded max-w-full">
      {data}
    </Markdown>
  )
}

function InscriptionContent({ inscription }: { inscription: Inscription }) {
  const mimeTitle = getMimeTitle(inscription.mime)

  if (mimeTitle === 'Markdown') {
    return <RemoteMarkdown src={inscription.content_path} />
  }

  if (mimeTitle === 'JSON') {
    return <RemoteMarkdown src={inscription.content_path} isJson />
  }

  // @todo text, html, audio, video, not supported

  return (
    <InscriptionImage
      src={inscription.content_path}
      isExplicit={inscription.is_explicit}
      mime={inscription.mime}
      className="object-none rounded"
    />
  )
}

export default function InscriptionPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col p-8">
      <header className="flex flex-row items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center">
          Inscription #{data.inscription.id - 1}: {data.inscription.name}
          <span className="text-sm font-extralight ml-2">
            {data.inscription.mime}
          </span>
        </h1>
        <div className="flex">
          <DaisyLink
            className="flex text-primary"
            href={data.inscription.content_path}
          >
            Download <CloudArrowDownIcon className="w-5 ml-1" />
          </DaisyLink>
          <Link
            className="flex text-primary ml-4 hover:underline"
            to={`/app/inscription/${data.inscription.transaction.hash}`}
          >
            View on Asteroids <LinkIcon className="w-5 ml-1" />
          </Link>
        </div>
      </header>
      <div className="flex pt-8 justify-center">
        <div className="flex flex-col w-full">
          <InscriptionContent inscription={data.inscription} />
        </div>
      </div>
    </div>
  )
}
