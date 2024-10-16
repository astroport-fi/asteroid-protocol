import { Inscription } from '~/api/inscription'
import Grid from './Grid'

function InscriptionBox({ inscription }: { inscription: Inscription }) {
  // @todo
  return (
    // <Link
    //   className="flex flex-col justify-between bg-base-200 rounded-xl group"
    //   to={`/app/launchpad/${collection.symbol}`}
    // >
    <div className="bg-base-300 flex flex-col py-4">
      <div className="flex flex-col px-4">
        <strong className="text-nowrap overflow-hidden text-ellipsis">
          {inscription.name}
        </strong>
        <p className="whitespace-pre-wrap">{inscription.description}</p>
      </div>
    </div>
    // </Link>
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
