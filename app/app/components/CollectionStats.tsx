import clsx from 'clsx'
import { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'
import { ClubStats } from '~/api/clubs'
import { CollectionStats } from '~/api/collection'
import { getSupplyTitle } from '~/utils/number'
import DecimalText from './DecimalText'
import PercentageText from './PercentageText'

function Stat({
  title,
  children,
  className,
}: PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <div className={twMerge('flex flex-col items-center shrink-0', className)}>
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
        'grid grid-cols-2 lg:flex lg:flex-grow gap-4 mt-6 lg:mt-2 xl:mt-0 md:gap-8 justify-center shrink-0',
        className,
      )}
    >
      <Stat title="Floor">
        <DecimalText value={stats.floor_price} suffix=" ATOM" />
      </Stat>
      <Stat title="Total Vol">
        <DecimalText value={stats.volume} suffix=" ATOM" />
      </Stat>
      <Stat title="Owners" className="hidden md:flex">
        {getSupplyTitle(stats.owners)}
      </Stat>
      <Stat title="Listed" className="hidden md:flex">
        {getSupplyTitle(stats.listed)}
      </Stat>
      <Stat title="Total supply">{getSupplyTitle(stats.supply)}</Stat>
      {hasRoyalty && (
        <Stat title="Royalty">
          <PercentageText value={royaltyPercentage} />
        </Stat>
      )}
    </div>
  )
}
