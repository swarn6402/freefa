import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(circle at top, rgba(201,168,76,0.22), transparent 34%), linear-gradient(135deg, #0d1725 0%, #03060d 100%)',
        }}
      >
        <svg width="180" height="180" viewBox="0 0 64 64" fill="none">
          <rect x="3.5" y="3.5" width="57" height="57" rx="18" fill="#07111C" />
          <rect x="3.5" y="3.5" width="57" height="57" rx="18" stroke="#C9A84C" />
          <circle cx="32" cy="19" r="7.5" fill="#07101B" stroke="#F5F7FB" strokeWidth="2.25" />
          <path d="M32 12.5V25.5" stroke="#F5F7FB" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M27 17.25C28.4 14.95 30.05 13.8 32 13.8C33.95 13.8 35.6 14.95 37 17.25"
            stroke="#C9A84C"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M26 27.5V35.5C26 40.35 28.7 43.5 32 43.5C35.3 43.5 38 40.35 38 35.5V27.5"
            stroke="#F5F7FB"
            strokeWidth="4.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21.75 40.5C24.95 43.9 28.35 45.6 32 45.6C35.65 45.6 39.05 43.9 42.25 40.5"
            stroke="#C9A84C"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <rect x="18" y="48" width="8" height="4" rx="2" fill="#2F6FED" />
          <rect x="28" y="48" width="8" height="4" rx="2" fill="#C9A84C" />
          <rect x="38" y="48" width="8" height="4" rx="2" fill="#E64D5E" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
