import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090B',
          borderRadius: '16px',
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diamond constellation */}
          <path
            d="M50 20 L25 50 L50 80 L75 50 Z"
            stroke="#818CF8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.6"
          />
          {/* Cross lines */}
          <path d="M50 20 L50 80" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
          <path d="M25 50 L75 50" stroke="#818CF8" strokeWidth="2" strokeDasharray="4 4" opacity="0.3" />
          {/* Nodes */}
          <circle cx="50" cy="20" r="6" fill="#818CF8" />
          <circle cx="25" cy="50" r="6" fill="#818CF8" />
          <circle cx="75" cy="50" r="6" fill="#818CF8" />
          <circle cx="50" cy="80" r="6" fill="#818CF8" />
          {/* Central spark */}
          <circle cx="50" cy="50" r="8" fill="#818CF8" />
          {/* Core glow */}
          <circle cx="50" cy="50" r="20" fill="#818CF8" opacity="0.15" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
