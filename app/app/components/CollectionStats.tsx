import clsx from 'clsx'
import { PropsWithChildren } from 'react'
import { ClubStats } from '~/api/clubs'
import { CollectionStats } from '~/api/collection'
import { getSupplyTitle } from '~/utils/number'
import DecimalText from './DecimalText'
import PercentageText from './PercentageText'

function Stat({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <div className="flex flex-col shrink-0">
      <span className="uppercase text-header-content text-sm">{title}</span>
      <div className="mt-1 font-semibold text-center">{children}</div>
    </div>
  )
}

export default function CollectionStatsComponent({
  stats,
  royaltyPercentage,
  className,
}: {
  stats: CollectionStats | ClubStats
  royaltyPercentage?: number
  className?: string
}) {
  const hasRoyalty = !!royaltyPercentage
  return (
    <div
      className={clsx(
        'flex flex-grow gap-8 justify-center shrink-0',
        className,
      )}
    >
      <Stat title="Floor">
        <DecimalText value={stats.floor_price} suffix=" ATOM" />
      </Stat>
      <Stat title="Total Vol">
        <DecimalText value={stats.volume} suffix=" ATOM" />
      </Stat>
      <Stat title="Owners">{getSupplyTitle(stats.owners)}</Stat>
      <Stat title="Listed">{getSupplyTitle(stats.listed)}</Stat>
      <Stat title="Total supply">{getSupplyTitle(stats.supply)}</Stat>
      {hasRoyalty && (
        <Stat title="Royalty">
          <PercentageText value={royaltyPercentage} />
        </Stat>
      )}
    </div>
  )
}
