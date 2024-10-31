import { Link } from 'react-daisyui'

export default function TrollboxLink() {
  return (
    <p>
      Trollbox.app is a social media network built on top of Asteroid Protocol.
      Join the conversation at{' '}
      <Link
        href="https://trollbox.app"
        target="_blank"
        className="text-primary"
      >
        Trollbox.app
      </Link>
      .
    </p>
  )
}
