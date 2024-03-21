import { LoaderFunctionArgs, MetaFunction, json } from '@remix-run/cloudflare'
import { Link, useLoaderData } from '@remix-run/react'
import { formatRelative } from 'date-fns'
import { Divider } from 'react-daisyui'
import { AsteroidClient } from '~/api/client'
import { isTokenLaunched } from '~/api/token'
import InscriptionImage from '~/components/InscriptionImage'
import MintToken from '~/components/MintToken'
import Tokenomics from '~/components/Tokenomics'
import { mintTokenMeta } from '~/utils/meta'

export async function loader({ context, params }: LoaderFunctionArgs) {
  if (!params.ticker) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const asteroidClient = new AsteroidClient(context.cloudflare.env.ASTEROID_API)
  const token = await asteroidClient.getToken(params.ticker, true)

  if (!token) {
    throw new Response(null, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  return json({ token })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return []
  }

  return mintTokenMeta(data.token)
}

export default function MintTokenPage() {
  const data = useLoaderData<typeof loader>()
  return (
    <div className="flex w-full h-svh bg-no-repeat bg-cover bg-center bg-[url('/app/images/background/meteor.webp')]">
      <div className="flex flex-col items-center bg-opacity-50 bg-black w-full h-full">
        <div className="flex h-fit p-8 rounded-xl flex-col w-full max-w-lg mt-32 bg-base-100">
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
          {isTokenLaunched(data.token) ? (
            <MintToken
              className="mt-16 text-center"
              token={data.token}
              showConnectWallet
            />
          ) : (
            <div>
              <Divider />
              <div className="flex flex-col items-center">
                <span className="text-lg">Minting starts</span>
                <span className="mt-2 text-primary text-xl">
                  {formatRelative(
                    data.token.launch_timestamp * 1000,
                    new Date(),
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
        <span className="flex w-full max-w-lg justify-end mt-2 mr-2 font-light">
          powered by{' '}
          <Link to="/app/tokens" className="text-primary ml-1">
            ASTEROIDS
          </Link>
        </span>
      </div>
    </div>
  )
}
