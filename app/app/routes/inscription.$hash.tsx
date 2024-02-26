import { CloudArrowDownIcon, LinkIcon } from '@heroicons/react/24/outline'
import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Link as DaisyLink } from 'react-daisyui'
import Markdown from 'react-markdown'
import { AsteroidClient } from '~/api/client'
import { Inscription } from '~/api/inscription'
import InscriptionImage from '~/components/InscriptionImage'
import { getMimeTitle } from '~/utils/string'

export async function loader({ context, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.env.ASTEROID_API)

  if (!params.hash) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const inscription = await asteroidClient.getInscription(params.hash)

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
    <Markdown className="prose bg-base-200 p-8 rounded w-full max-w-full">
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

  if (mimeTitle === 'Text') {
    return <RemoteMarkdown src={inscription.content_path} isJson />
  }

  if (mimeTitle === 'Audio') {
    return (
      <audio controls>
        <source src={inscription.content_path} type={inscription.mime} />
        <source src={inscription.content_path} type="audio/wav" />
        Audio not supported by browser
      </audio>
    )
  }

  if (mimeTitle === 'Video') {
    return (
      <video className="rounded w-fit" controls>
        <source src={inscription.content_path} type={inscription.mime} />
        Video not supported by browser
      </video>
    )
  }

  // @todo html, not supported

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
        <div className="flex items-center">
          <Link to="/app">Asteroid</Link>
          <h1 className="text-2xl font-bold flex items-center ml-2">
            Inscription #{data.inscription.id - 1}: {data.inscription.name}
            <span className="text-sm font-extralight ml-2">
              {data.inscription.mime}
            </span>
          </h1>
        </div>

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
        <div className="flex flex-col w-full items-center">
          <InscriptionContent inscription={data.inscription} />
        </div>
      </div>
    </div>
  )
}
