import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import Markdown from 'react-markdown'
import { AsteroidClient } from '~/api/client'
import InscriptionImage from '~/components/InscriptionImage'
import { inscriptionMeta } from '~/utils/meta'
import logo from '../images/logo/white.svg'

export async function loader({ context, params }: LoaderFunctionArgs) {
  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)

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

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return []
  }

  return inscriptionMeta(data.inscription)
}

export default function InscriptionPage() {
  const data = useLoaderData<typeof loader>()

  return (
    <div className="flex flex-col p-8">
      <header className="flex flex-row items-center justify-between">
        <div className="flex items-center w-full">
          <Link to="/app/inscriptions">
            <img src={logo} alt="Asteroid protocol" />
          </Link>
        </div>
      </header>
      <div className="flex w-full justify-center">
        <div className="flex flex-col items-center w-full max-w-3xl">
          <h1 className="text-3xl font-bold flex w-full">
            {data.inscription.name}
          </h1>
          <InscriptionImage
            src={data.inscription.content_path}
            isExplicit={data.inscription.is_explicit}
            mime={data.inscription.mime}
            containerClassName="mt-8 rounded-none max-h-md"
          />
          <Markdown className="prose w-full max-w-full mt-8">
            {data.inscription.description}
          </Markdown>
        </div>
      </div>
    </div>
  )
}
