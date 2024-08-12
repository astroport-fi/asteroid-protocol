import { Link } from '@remix-run/react'
import { Link as DaisyLink } from 'react-daisyui'
import logo from '~/images/logo/asteroid-white-transparent-narrow.png'

export default function Index() {
  return (
    <div className="w-full min-h-svh h-full bg-no-repeat bg-cover bg-center bg-[url('/app/images/background/inscriptions-landscape.webp')]">
      <img src={logo} alt="logo" className="w-44 p-8" />
      <div className="md:w-1/2 px-16 pt-16 md:pt-32">
        <h1 className="text-5xl md:text-8xl font-medium text-white">
          INSCRIBE
          <br />
          ANYTHING
          <br />
          ON THE HUB
        </h1>
        <p className="mt-4 text-xl">
          From images and video to text and tokens, Asteroid protocol allows you
          to inscribe anything. Our metaprotocol framework opens the door to a
          vast new world of possibilities on the Hub
        </p>
        <div className="flex flex-row my-12 items-center">
          <Link to="/app/inscriptions" className="btn btn-primary btn-md">
            Continue to app
          </Link>
          <DaisyLink
            className="ml-4 font-light shrink-0"
            href="https://docs.asteroidprotocol.io"
            target="_blank"
          >
            Learn more
          </DaisyLink>
        </div>
      </div>
    </div>
  )
}
