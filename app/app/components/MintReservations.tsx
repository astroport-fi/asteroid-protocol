import { Link } from '@remix-run/react'
import { MintReservation } from '~/api/launchpad'
import Grid from './Grid'
import InscriptionImage from './InscriptionImage'

function ReservationBox({ reservation }: { reservation: MintReservation }) {
  const { collection } = reservation.launchpad

  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl group"
      to={`/app/launchpad/${collection.symbol}`}
    >
      <InscriptionImage
        src={collection.content_path!}
        isExplicit={collection.is_explicit}
        className="h-60"
        containerClassName="rounded-t-xl"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {collection.name}
          </strong>
          <span>Mint reservation</span>
        </div>
      </div>
    </Link>
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
