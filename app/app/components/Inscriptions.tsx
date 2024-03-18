import { Link } from '@remix-run/react'
import { Divider } from 'react-daisyui'
import { NumericFormat } from 'react-number-format'
import { InscriptionWithMarket } from '~/api/inscription'
import { getDecimalValue } from '~/utils/number'
import Grid from './Grid'
import InscriptionImage from './InscriptionImage'

function InscriptionBox<T extends InscriptionWithMarket>({
  inscription,
  onClick,
}: {
  inscription: T
  onClick?: (inscription: T) => void
}) {
  const listing = inscription.marketplace_listing

  return (
    <Link
      className="flex flex-col justify-between bg-base-200 rounded-xl"
      to={`/app/inscription/${inscription.transaction.hash}`}
      onClick={(e) => {
        if (typeof onClick === 'function') {
          e.preventDefault()
          onClick(inscription)
        }
      }}
    >
      <InscriptionImage
        src={inscription.content_path}
        isExplicit={inscription.is_explicit}
        mime={inscription.mime}
        className="rounded-t-xl h-60"
      />
      <div className="bg-base-300 rounded-b-xl flex flex-col py-4">
        <div className="flex flex-col px-4">
          <strong className="text-nowrap overflow-hidden text-ellipsis">
            {inscription.name}
          </strong>
          <span>#{inscription.id - 1}</span>
        </div>
        <Divider className="my-1" />
        <div className="flex flex-col items-center">
          {listing ? (
            <>
              <span className="text-lg">
                <NumericFormat
                  className="mr-1"
                  displayType="text"
                  thousandSeparator
                  value={getDecimalValue(listing.total, 6)}
                />
                <span>ATOM</span>
              </span>
              <span className="uppercase text-sm text-header-content">
                Price
              </span>
            </>
          ) : (
            <span className="text-lg py-2.5">No listing</span>
          )}
        </div>
      </div>
    </Link>
  )
}

export function Inscriptions<T extends InscriptionWithMarket>({
  inscriptions,
  onClick,
  className,
}: {
  className?: string
  inscriptions: T[]
  onClick?: (inscription: T) => void
}) {
  return (
    <Grid className={className}>
      {inscriptions.map((inscription) => (
        <InscriptionBox
          key={inscription.id}
          inscription={inscription}
          onClick={onClick}
        />
      ))}
    </Grid>
  )
}
