import classNames from 'classnames'
import clsx from 'clsx'
import { forwardRef, useRef, useState } from 'react'

interface Props {
  items: string[]
  value?: React.InputHTMLAttributes<HTMLInputElement>['value']
  name?: string
  disabled?: React.InputHTMLAttributes<HTMLInputElement>['disabled']
  error?: boolean
  onBlur?: React.InputHTMLAttributes<HTMLInputElement>['onBlur']
  onChange: (value: string) => void
}

const Autocomplete = forwardRef<HTMLInputElement, Props>(function Autocomplete(
  { items, value, name, disabled, error, onChange, onBlur },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  return (
    <div
      className={classNames({
        'dropdown w-full': true,
        'dropdown-open': open,
      })}
      ref={containerRef}
    >
      <input
        type="text"
        ref={ref}
        name={name}
        disabled={disabled}
        className={clsx('input input-bordered w-full', {
          'input-error': !!error,
        })}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Type something.."
        tabIndex={0}
      />
      <div className="dropdown-content z-10 bg-base-200 top-14 max-h-96 overflow-auto flex-col rounded-md">
        <ul
          className="menu menu-compact "
          style={{ width: containerRef.current?.clientWidth }}
        >
          {items.map((item, index) => {
            return (
              <li
                key={index}
                tabIndex={index + 1}
                className="border-b border-b-base-content/10 w-full"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    onChange(item)
                    setOpen(false)
                    e.currentTarget.blur()
                  }}
                >
                  {item}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
})

export default Autocomplete
