import React, { useEffect, useRef, useState } from 'react'

const ScalableText: React.FC<{ text: string }> = ({ text }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const adjustScale = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const containerHeight = containerRef.current.clientHeight
        const textWidth = textRef.current.scrollWidth
        const textHeight = textRef.current.scrollHeight

        const widthScale = containerWidth / textWidth
        const heightScale = containerHeight / textHeight
        const newScale = Math.min(widthScale, heightScale, 1)

        setScale(newScale)
      }
    }

    adjustScale()
    window.addEventListener('resize', adjustScale)

    return () => {
      window.removeEventListener('resize', adjustScale)
    }
  }, [text])

  return (
    <div
      ref={containerRef}
      className="min-h-40 h-full w-full flex justify-center items-center overflow-hidden"
    >
      <div
        ref={textRef}
        className="whitespace-pre"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {text}
      </div>
    </div>
  )
}

export default ScalableText
