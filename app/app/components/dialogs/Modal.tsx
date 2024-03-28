import clsx from 'clsx'
import type { IComponentBaseProps } from 'node_modules/react-daisyui/dist/types'
import { forwardRef } from 'react'
import { Modal as DaisyUIModal } from 'react-daisyui'
import { twMerge } from 'tailwind-merge'

export type ModalProps = React.DialogHTMLAttributes<HTMLDialogElement> &
  IComponentBaseProps & {
    open?: boolean
    responsive?: boolean
    backdrop?: boolean
  }

const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  (
    { children, open, responsive, backdrop, dataTheme, className, ...props },
    ref,
  ): JSX.Element => {
    const containerClasses = twMerge(
      'modal',
      clsx({
        'modal-open': open,
        'modal-bottom sm:modal-middle': responsive,
      }),
    )

    const bodyClasses = twMerge('modal-box', className)

    return (
      <dialog
        {...props}
        aria-label="Modal"
        aria-hidden={!open}
        open={open}
        aria-modal={open}
        data-theme={dataTheme}
        className={containerClasses}
        ref={ref}
      >
        <div data-theme={dataTheme} className={bodyClasses}>
          {children}
        </div>
        {backdrop && (
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        )}
      </dialog>
    )
  },
)

Modal.displayName = 'Modal'

export default Object.assign(Modal, {
  Header: DaisyUIModal.Header,
  Body: DaisyUIModal.Body,
  Actions: DaisyUIModal.Actions,
  Legacy: DaisyUIModal.Legacy,
  useDialog: DaisyUIModal.useDialog,
})
