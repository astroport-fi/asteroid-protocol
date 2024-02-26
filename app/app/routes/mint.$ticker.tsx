import { LoaderFunctionArgs, json } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import InscriptionImage from '~/components/InscriptionImage'
import MintToken from '~/components/MintToken'
import Tokenomics from '~/components/Tokenomics'

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, true)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  return json({ token })
}

export default function MintTokenPage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex justify-center w-full h-svh bg-no-repeat bg-cover bg-center bg-[url('/app/images/background/meteor.webp')]">
      <div className="flex h-fit p-8 rounded-xl flex-col w-full max-w-lg m-8 mt-32 bg-base-100">
        <div className="flex flex-col items-center">
          <InscriptionImage
            mime="image/png"
            src={data.token.content_path!}
            // isExplicit={token.is_explicit} @todo
            className="rounded-xl max-w-40 bg-base-200 relative top-[-5rem]"
          />
          <span className="mt-[-4rem]">${data.token.ticker}</span>
          <h1 className="font-medium text-2xl mt-2">{data.token.name}</h1>
        </div>
        <Divider className="mt-8" />
        <h2 className="font-medium text-lg">Tokenomics</h2>
        <Divider />
        <Tokenomics token={data.token} />
        <MintToken
          className="mt-16 text-center"
          ticker={data.token.ticker}
          amount={data.token.per_mint_limit}
        />
      </div>
    </div>
  )
}
