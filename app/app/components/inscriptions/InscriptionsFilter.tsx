import { Form, Link, useSearchParams } from '@remix-run/react'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import {
  Checkbox,
  Collapse,
  Form as DaisyForm,
  Divider,
  Input,
  Radio,
} from 'react-daisyui'
import { twMerge } from 'tailwind-merge'
import { CollectionTrait } from '~/api/collection'
import Select, { DropdownItem } from '~/components/form/Select'
import { TraitValue, getTraitsMap } from '~/utils/traits'
import {
  DEFAULT_PRICE_RANGE,
  DEFAULT_RANGE,
  DEFAULT_STATUS,
  PriceRange,
  Range,
  Sort,
  Status,
  getDefaultSort,
} from '.'

function FilterTitle({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={twMerge('text-header-content text-sm uppercase', className)}
    >
      {children}
    </span>
  )
}

function StatusFilter({
  selected,
  onChange,
}: {
  selected: Status
  onChange: (status: Status) => void
}) {
  return (
    <div className="flex flex-col">
      <DaisyForm.Label
        title="Only buy now"
        className="flex flex-row-reverse items-center justify-end px-0"
      >
        <Radio
          value="buy"
          className="mr-2"
          name="status"
          checked={selected == 'buy'}
          onChange={() => onChange('buy')}
        />
      </DaisyForm.Label>

      <DaisyForm.Label
        title="Show all"
        className="flex flex-row-reverse items-center justify-end px-0"
      >
        <Radio
          value="all"
          className="mr-2"
          name="status"
          checked={selected == 'all'}
          onChange={() => onChange('all')}
        />
      </DaisyForm.Label>
    </div>
  )
}

interface Props {
  traits?: CollectionTrait[]
}

function TraitFilter({
  trait,
  values,
}: {
  trait: string
  values: TraitValue[]
}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const traitParam = searchParams.get(trait)
  const [open, setOpen] = useState(traitParam != null)

  const selected = useMemo(() => {
    if (!traitParam) {
      return new Set<string>()
    }
    return new Set(traitParam.split(','))
  }, [traitParam])

  return (
    <Collapse icon="arrow" checkbox open={open} onToggle={() => setOpen(!open)}>
      <Collapse.Title className="pl-0 pr-9 flex justify-between items-center text-sm">
        {trait}
        <span className="ml-8">{values.length}</span>
      </Collapse.Title>
      <Collapse.Content className="pl-0">
        {values.map(({ count, value }) => (
          <label
            key={value}
            className="w-full py-1 flex items-center justify-between text-sm"
          >
            <span className="flex items-center">
              <Checkbox
                size="sm"
                checked={selected.has(value)}
                onChange={(e) => {
                  setSearchParams((prev) => {
                    if (e.target.checked) {
                      selected.add(value)
                    } else {
                      selected.delete(value)
                    }

                    if (selected.size) {
                      prev.set(trait, Array.from(selected).join(','))
                    } else {
                      prev.delete(trait)
                    }

                    return prev
                  })
                }}
              />
              <span className="ml-2">{value}</span>
            </span>
            <span className="ml-4">{count}</span>
          </label>
        ))}
      </Collapse.Content>
    </Collapse>
  )
}

function TraitsFilter({ traits }: { traits: CollectionTrait[] }) {
  const traitsMap = useMemo(() => {
    return getTraitsMap(traits)
  }, [traits])

  const traitsComponents: JSX.Element[] = []
  for (const [trait, values] of traitsMap) {
    traitsComponents.push(
      <TraitFilter key={trait} trait={trait} values={values} />,
    )
  }

  return (
    <div>
      <FilterTitle>Traits</FilterTitle>
      {traitsComponents}
    </div>
  )
}

export function Filter({ traits }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()

  const sortItems: DropdownItem<Sort>[] = [
    { label: 'Recently listed', value: Sort.RECENTLY_LISTED },
    { label: 'Lowest ID', value: Sort.LOWEST_ID },
    { label: 'Lowest price', value: Sort.LOWEST_PRICE },
    { label: 'Highest price', value: Sort.HIGHEST_PRICE },
    { label: 'Highest ID', value: Sort.HIGHEST_ID },
  ]

  const priceRangeItems: DropdownItem<PriceRange>[] = [
    { label: 'All', value: PriceRange.ALL },
    { label: '< 0.1 ATOM', value: PriceRange.BELOW_0_1 },
    { label: '0.1 - 1 ATOM', value: PriceRange.BETWEEN_0_1_AND_1 },
    { label: '1 - 5 ATOM', value: PriceRange.BETWEEN_1_AND_5 },
    { label: '5 - 10 ATOM', value: PriceRange.BETWEEN_5_AND_10 },
    { label: '10 - 100 ATOM', value: PriceRange.BETWEEN_10_AND_100 },
    { label: '100 ATOM+', value: PriceRange.ABOVE_100 },
  ]

  const rangeItems: DropdownItem<Range>[] = [
    { label: 'All', value: Range.ALL },
    { label: 'Sub 100', value: Range.SUB_100 },
    { label: 'Sub 1 000', value: Range.SUB_1_000 },
    { label: 'Sub 10 000', value: Range.SUB_10_000 },
    { label: 'Sub 50 000', value: Range.SUB_50_000 },
  ]

  const [status, setStatus] = useState<Status>(
    (searchParams.get('status') as Status) ?? DEFAULT_STATUS,
  )

  const [sort, setSort] = useState<Sort>(
    (searchParams.get('sort') as Sort) ?? getDefaultSort(status),
  )

  const priceFrom = searchParams.get('from')
  let defaultPriceRange = DEFAULT_PRICE_RANGE
  if (priceFrom) {
    defaultPriceRange = `${priceFrom}-${searchParams.get('to')}` as PriceRange
  }
  const [priceRange, setPriceRange] = useState<PriceRange>(defaultPriceRange)
  const [range, setRange] = useState<Range>(
    (searchParams.get('range') as Range) ?? DEFAULT_RANGE,
  )

  const defaultSearch = searchParams.get('search') ?? ''

  useEffect(() => {
    const currentStatus = searchParams.get('status') ?? DEFAULT_STATUS
    if (currentStatus !== status) {
      setSearchParams((prev) => {
        prev.delete('sort')
        prev.set('status', status)
        return prev
      })
    }
  }, [searchParams, status, setSearchParams])

  useEffect(() => {
    const defaultSort = getDefaultSort(status)
    const currentSort = searchParams.get('sort') ?? defaultSort
    if (currentSort !== sort) {
      setSearchParams((prev) => {
        if (sort === defaultSort) {
          prev.delete('sort')
        } else {
          prev.set('sort', sort)
        }
        return prev
      })
    }
  }, [searchParams, sort, status, setSearchParams])

  useEffect(() => {
    const currentRange = searchParams.get('range') ?? DEFAULT_RANGE
    if (currentRange !== range) {
      setSearchParams((prev) => {
        prev.set('range', range)
        return prev
      })
    }
  }, [searchParams, range, setSearchParams])

  useEffect(() => {
    const from = searchParams.get('from') ?? DEFAULT_PRICE_RANGE
    const range = priceRange.split('-')
    if (from !== range[0]) {
      setSearchParams((prev) => {
        if (range[0] == PriceRange.ALL) {
          prev.delete('from')
          prev.delete('to')
        } else {
          prev.set('from', range[0])
          prev.set('to', range[1])
        }

        return prev
      })
    }
  }, [searchParams, priceRange, setSearchParams])

  return (
    <div className="flex flex-col shrink-0 items-center w-52 border-r border-r-neutral">
      <div className="flex flex-col items-start absolute py-8 overflow-y-scroll h-[calc(100vh-13rem)]">
        <div className="flex flex-col items-start w-full px-6">
          <FilterTitle>Status</FilterTitle>
          <StatusFilter
            selected={status}
            onChange={(newStatus) => {
              setStatus(newStatus)
              setSort(getDefaultSort(newStatus))
            }}
          />
          <FilterTitle className="mt-6">Search</FilterTitle>
          <Form method="get">
            <Input
              className="mt-2 max-w-40"
              placeholder="Name"
              name="search"
              size="sm"
              defaultValue={defaultSearch}
            />
          </Form>
          <FilterTitle className="mt-6">Sort</FilterTitle>
          <Select items={sortItems} onSelect={setSort} selected={sort} />
          <FilterTitle className="mt-6">Price</FilterTitle>
          <Select
            items={priceRangeItems}
            onSelect={setPriceRange}
            selected={priceRange}
          />
          <FilterTitle className="mt-6">Inscription range</FilterTitle>
          <Select items={rangeItems} onSelect={setRange} selected={range} />
          {traits && (
            <>
              <Divider />
              <TraitsFilter traits={traits} />
            </>
          )}

          <Link
            to="/app/wallet/inscriptions"
            className="btn btn-primary mt-8"
            color="accent"
          >
            List inscription
          </Link>
        </div>
      </div>
    </div>
  )
}
