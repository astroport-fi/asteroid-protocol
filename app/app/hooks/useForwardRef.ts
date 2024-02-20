import { ForwardedRef, useEffect, useRef } from 'react'

export default function useForwardRef<T>(
  ref: ForwardedRef<T>,
  initialValue: T | null = null,
) {
  const targetRef = useRef<T | null>(initialValue)

  useEffect(() => {
    if (!ref) return

    if (typeof ref === 'function') {
      ref(targetRef.current)
    } else {
      targetRef.current = ref.current
    }
  }, [ref])

  return targetRef
}
