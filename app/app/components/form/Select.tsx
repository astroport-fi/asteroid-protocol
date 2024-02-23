import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { IComponentBaseProps } from 'node_modules/react-daisyui/dist/types'
import { DetailsHTMLAttributes, forwardRef, useState } from 'react'
import { Dropdown } from 'react-daisyui'

export interface DropdownItem {
  label: string
  value: string
}

export type DetailsProps = DetailsHTMLAttributes<HTMLDetailsElement> &
  IComponentBaseProps & {
    horizontal?: 'left' | 'right'
    vertical?: 'top' | 'bottom'
    end?: boolean
    hover?: boolean
    open?: boolean
  }

const Details = forwardRef<HTMLDetailsElement, DetailsProps>(function Details(
  {
    children,
    className,
    hover,
    horizontal,
    vertical,
    end,
    dataTheme,
    open,
    ...props
  },
  ref,
): JSX.Element {
  return (
    <details
      {...props}
      ref={ref}
      data-theme={dataTheme}
      className={clsx('dropdown', className, {
        'dropdown-left': horizontal === 'left',
        'dropdown-right': horizontal === 'right',
        'dropdown-top': vertical === 'top',
        'dropdown-bottom': vertical === 'bottom',
        'dropdown-end': end,
        'dropdown-hover': hover,
        'dropdown-open': open,
      })}
      open={open}
    >
      {children}
    </details>
  )
})

export default function Select({
  items,
  selected,
  onSelect,
}: {
  items: DropdownItem[]
  selected: DropdownItem
  onSelect: (item: DropdownItem) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Details
      open={open}
      onToggle={(e) => {
        setOpen(e.currentTarget.open)
      }}
    >
      <Dropdown.Details.Toggle
        className="flex flex-row hover:bg-transparent"
        color="ghost"
      >
        {selected.label}
        {open ? (
          <ChevronUpIcon className="size-5" />
        ) : (
          <ChevronDownIcon className="size-5" />
        )}
      </Dropdown.Details.Toggle>
      <Dropdown.Menu className="w-52 z-10">
        {items.map((item) => (
          <Dropdown.Item
            onClick={() => {
              setOpen(false)
              onSelect(item)
            }}
            key={item.value}
          >
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Details>
  )
}
