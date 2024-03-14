import { useCallback, useRef, useState } from 'react'

export default function useDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const showDialog = useCallback(() => {
    dialogRef.current?.showModal()
  }, [dialogRef])

  const hideDialog = useCallback(() => {
    dialogRef.current?.close()
  }, [dialogRef])

  return { dialogRef, showDialog, hideDialog }
}

export function useDialogWithValue<T>(defaultValue: T | null = null) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState<T | null>(defaultValue)

  const showDialog = useCallback(
    (newValue: T) => {
      setValue(newValue)
      dialogRef.current?.showModal()
    },
    [dialogRef],
  )

  const hideDialog = useCallback(() => {
    dialogRef.current?.close()
  }, [dialogRef])

  return { dialogRef, value, showDialog, hideDialog }
}
