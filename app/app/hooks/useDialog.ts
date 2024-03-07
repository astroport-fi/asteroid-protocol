import { useCallback, useRef } from 'react'

export default function useDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const handleShow = useCallback(() => {
    dialogRef.current?.showModal()
  }, [dialogRef])

  const handleHide = useCallback(() => {
    dialogRef.current?.close()
  }, [dialogRef])

  return { dialogRef, handleShow, handleHide }
}
