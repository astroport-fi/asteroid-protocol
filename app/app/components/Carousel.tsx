import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { ScrollingCarousel } from '@trendyol-js/react-carousel'
import type { ReactElement } from 'react'

enum Direction {
  Left,
  Right,
}

function CarouselButton({ direction }: { direction: Direction }) {
  const Icon = direction === Direction.Left ? ChevronLeftIcon : ChevronRightIcon
  const className = direction === Direction.Left ? 'left-4' : 'right-4'

  return (
    <button
      className={`absolute z-10 ${className} top-[calc(50%-2rem)] btn btn-circle btn-primary`}
    >
      <Icon className="size-5" />
    </button>
  )
}

export default function Carousel({
  children,
  className,
}: {
  children: ReactElement[]
  className?: string
}) {
  return (
    <ScrollingCarousel
      className={className}
      leftIcon={<CarouselButton direction={Direction.Left} />}
      rightIcon={<CarouselButton direction={Direction.Right} />}
    >
      {children}
    </ScrollingCarousel>
  )
}
