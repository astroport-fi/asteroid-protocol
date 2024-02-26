import { Link } from '@remix-run/react'
import { Link as DaisyLink } from 'react-daisyui'
import logo from '~/images/logo/asteroid-white-transparent-narrow.png'

export default function Index() {
  return (
    <div className="w-full h-svh bg-no-repeat bg-cover bg-center bg-[url('/app/images/background/inscriptions-landscape.webp')]">
      <img src={logo} alt="logo" className="w-44 p-8" />
      <div className="md:w-1/2 p-16 md:py-32">
        <h1 className="text-6xl md:text-8xl font-medium text-white">
          INSCRIBE
          <br />
          ANYTHING
          <br />
          ON THE HUB
        </h1>
        <p className="mt-4 text-xl">
          From images and video to text and tokens, Asteroid protocol allow you
          to inscribe anything. Our metaprotocol framework opens the door to a
          vast new world of possibilities on the Hub
        </p>
        <div className="flex flex-row mt-12 items-center">
          <Link to="/app/wallet" className="btn btn-primary btn-md">
            Continue to app
          </Link>
          <DaisyLink
            className="ml-4 font-light"
            href="https://medium.com/@delphilabs/introducing-asteroid-protocol-an-open-source-framework-for-inscriptions-and-tokens-on-cosmos-hub-03df146d48b1"
            target="_blank"
          >
            Learn more
          </DaisyLink>
        </div>
      </div>
    </div>
  )
}
