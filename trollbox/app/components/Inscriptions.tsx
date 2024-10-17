import { Link as DaisyLink } from 'react-daisyui'
import { Inscription } from '~/api/inscription'
import { useRootContext } from '~/context/root'
import Grid from './Grid'

function InscriptionBox({ inscription }: { inscription: Inscription }) {
  const { asteroidUrl } = useRootContext()

  return (
    <div className="bg-base-300 flex flex-col py-4">
      <div className="flex flex-col px-4">
        <strong className="text-nowrap overflow-hidden text-ellipsis">
          {inscription.name}
        </strong>
        <p className="whitespace-pre-wrap">{inscription.description}</p>
        <DaisyLink
          className="btn btn-sm mt-2"
          target="_blank"
          href={`${asteroidUrl}/app/inscription/${inscription.transaction.hash}`}
        >
          List on Asteroid Protocol
        </DaisyLink>
      </div>
    </div>
  )
}

export function Inscriptions({
  inscriptions,
  className,
}: {
  className?: string
  inscriptions: Inscription[]
}) {
  return (
    <Grid className={className}>
      {inscriptions.map((inscription) => (
        <InscriptionBox key={inscription.id} inscription={inscription} />
      ))}
    </Grid>
  )
}
