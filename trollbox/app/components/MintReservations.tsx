import { MintReservation } from '~/api/launchpad'
import Grid from './Grid'

function ReservationBox({ reservation }: { reservation: MintReservation }) {
  const { collection } = reservation.launchpad

  // @todo
  return (
    // <Link
    //   className="flex flex-col justify-between bg-base-200 rounded-xl group"
    //   to={`/app/launchpad/${collection.symbol}`}
    // >
    <div className="bg-base-300 flex flex-col py-4">
      <div className="flex flex-col px-4">
        <strong className="text-nowrap overflow-hidden text-ellipsis">
          {collection.name}
        </strong>
        <p className="whitespace-pre-wrap">
          {reservation.launchpad.collection.description}
        </p>
      </div>
    </div>
    // </Link>
  )
}

export function MintReservations({
  reservations,
  className,
}: {
  className?: string
  reservations: MintReservation[]
}) {
  return (
    <Grid className={className}>
      {reservations.map((reservation) => (
        <ReservationBox key={reservation.id} reservation={reservation} />
      ))}
    </Grid>
  )
}
