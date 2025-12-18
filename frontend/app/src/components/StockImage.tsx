import React, { useState } from 'react'

type Props = {
  src: string
  alt: string
  className?: string
  creditName?: string
  creditUrl?: string
  fallbackSrc?: string
}

export default function StockImage({ src, alt, className, creditName = 'Unsplash', creditUrl = 'https://unsplash.com', fallbackSrc = '/images/docs-placeholder.svg' }: Props) {
  const [failed, setFailed] = useState(false)
  const finalSrc = failed ? fallbackSrc : src
  return (
    <figure className={className}>
      <img
        src={finalSrc}
        alt={alt}
        className="w-full h-full object-cover rounded-xl border shadow-sm"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      <figcaption className="mt-2 text-xs text-gray-500">
        {failed ? (
          <span>Illustration: Local fallback</span>
        ) : (
          <>Photo: <a href={creditUrl} target="_blank" rel="noreferrer" className="underline">{creditName}</a></>
        )}
      </figcaption>
    </figure>
  )
}
