import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import type { IComponentBaseProps } from 'node_modules/react-daisyui/dist/types'
import { DetailsHTMLAttributes, forwardRef, useState } from 'react'
import { Dropdown } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

export interface DropdownItem<T extends string = string> {
  label: string
  value: T
}

export type DetailsProps = DetailsHTMLAttributes<HTMLDetailsElement> &
  IComponentBaseProps & {
    horizontal?: 'left' | 'right'
    vertical?: 'top' | 'bottom'
    end?: boolean
    hover?: boolean
    open?: boolean
  }

export const Details = forwardRef<HTMLDetailsElement, DetailsProps>(
  function Details(
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
  },
)

export default function Select<T extends string = string>({
  items,
  selected,
  onSelect,
  className,
}: {
  items: DropdownItem<T>[]
  selected: T
  onSelect: (item: T) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const { selectedItem, dropdownItems } = items.reduce(
    (acc, item) => {
      acc.dropdownItems.push(
        <Dropdown.Item
          tabIndex={0}
          onMouseDown={() => {
            setOpen(false)
            onSelect(item.value)
          }}
          key={item.value}
        >
          {item.label}
        </Dropdown.Item>,
      )
      if (item.value === selected) {
        acc.selectedItem = item
      }
      return acc
    },
    { selectedItem: items[0], dropdownItems: [] as JSX.Element[] },
  )

  return (
    <Details
      open={open}
      tabIndex={-1}
      onBlur={() => setOpen(false)}
      onToggle={(e) => {
        setOpen(e.currentTarget.open)
      }}
    >
      <Dropdown.Details.Toggle
        className="flex flex-row hover:bg-transparent px-0"
        color="ghost"
      >
        {selectedItem.label}
        {open ? (
          <ChevronUpIcon className="size-5" />
        ) : (
          <ChevronDownIcon className="size-5" />
        )}
      </Dropdown.Details.Toggle>
      <Dropdown.Menu className={twMerge('w-52 z-10', className)}>
        {dropdownItems}
      </Dropdown.Menu>
    </Details>
  )
}
