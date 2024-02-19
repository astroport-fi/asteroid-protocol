import { Link } from '@remix-run/react'
import { Inscription } from '~/services/asteroid'
import { getDateAgo } from '~/utils/date'
import { round1 } from '~/utils/math'
import { getMimeTitle } from '~/utils/string'
import InscriptionImage from './InscriptionImage'

function InscriptionBox({ inscription }: { inscription: Inscription }) {
  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/inscription/${inscription.transaction.hash}`}
    >
      <InscriptionImage
        src={inscription.content_path}
        isExplicit={inscription.is_explicit}
        mime={inscription.mime}
        className="rounded-t-xl"
      />
      <div className="flex flex-col bg-base-300 rounded-b-xl p-4">
        <strong>{inscription.name}</strong>
        <span>#{inscription.id - 1}</span>
        <span>
          {getMimeTitle(inscription.mime)}{' '}
          {round1(inscription.content_size_bytes / 1024)} kb
        </span>
        <span>{getDateAgo(inscription.date_created)}</span>
      </div>
    </Link>
  )
}

export function Inscriptions({
  inscriptions,
}: {
  inscriptions: Inscription[]
}) {
  return (
    <div className="grid grid-cols-6 gap-4">
      {inscriptions.map((inscription) => (
        <InscriptionBox key={inscription.id} inscription={inscription} />
      ))}
    </div>
  )
}
