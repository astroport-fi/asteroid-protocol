import { Link } from 'react-daisyui'
import astrada from '~/images/apps/astrada.jpg'
import roidrunner from '~/images/apps/roidrunner.jpeg'
import trollbox from '~/images/apps/trollbox.jpeg'

function App({
  title,
  description,
  image,
  link,
}: {
  title: string
  description: JSX.Element | string
  link: string
  image: string
}) {
  return (
    <div className="flex flex-col">
      <strong className="text-xl">{title}</strong>
      <p className="mt-2">{description}</p>
      <Link href={link} className="text-primary" target="_blank">
        {link}
      </Link>
      <img src={image} alt={title} className="w-full object-cover mt-4" />
    </div>
  )
}

export default function Apps() {
  return (
    <div className="flex justify-center mb-8">
      <div className="grid lg:grid-cols-2 gap-8 max-w-7xl">
        <App
          image={trollbox}
          title="Trollbox"
          link="http://trollbox.app"
          description="Immortalize your words as tokens, collect trending content and trade your thoughts at"
        />
        <App
          image={astrada}
          title="The Asteroid Art Factory"
          link="https://astarda.xyz"
          description="Generate and transform AI-powered images into inscriptions on the Asteroid Protocol. 🎨✨"
        />
        <App
          image={roidrunner}
          title="Roidrunner"
          link="https://roidrunner.fun"
          description="First game on Cosmos Hub powered by Asteroid Protocol."
        />
        <div className="flex flex-col items-center text-center p-4 justify-center border rounded-xl border-dashed">
          <p className="mt-4">
            <strong className="text-xl">
              Want to build on Asteroid Protocol?
            </strong>
          </p>
          <Link
            href="https://docs.asteroidprotocol.io"
            className="text-primary mt-4"
            target="_blank"
          >
            Check out Asteroid Docs
          </Link>
          <p className="my-4">OR</p>
          <Link
            href="
            https://t.me/asteroidxyz"
            className="text-primary"
            target="_blank"
          >
            Join the community
          </Link>
        </div>
      </div>
    </div>
  )
}
