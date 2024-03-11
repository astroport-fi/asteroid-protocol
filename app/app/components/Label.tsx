import type { IComponentBaseProps } from 'node_modules/react-daisyui/dist/types'
import React from 'react'
import { twMerge } from 'tailwind-merge'

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> &
  IComponentBaseProps & {
    title?: string
    icon?: React.ReactNode
  }

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, title, icon, className, ...props },
  ref,
): JSX.Element {
  const classes = twMerge('label', className)

  return (
    <label {...props} className={classes}>
      <span
        className="flex flex-row items-center label-text cursor-pointer"
        ref={ref}
      >
        {icon != null ? (
          <>
            {icon}
            <span className="ml-2">{title}</span>
          </>
        ) : (
          title
        )}
      </span>
      {children}
    </label>
  )
})

export default Label
