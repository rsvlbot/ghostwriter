import { cn } from '../../lib/utils'

interface LogoProps {
  className?: string
  size?: number
}

// Stylized ghost emerging from pen/quill strokes
export function GhostwriterLogo({ className, size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-white', className)}
    >
      {/* Ghost body - fluid, elegant shape */}
      <path
        d="M24 4C15.163 4 8 11.163 8 20v14c0 1.5 1.2 2 2 1.2l3-2.4c.5-.4 1.2-.4 1.7 0l3.3 2.6c.5.4 1.2.4 1.7 0l4.3-3.4c.5-.4 1.2-.4 1.7 0l4.3 3.4c.5.4 1.2.4 1.7 0l3.3-2.6c.5-.4 1.2-.4 1.7 0l3 2.4c.8.8 2 .3 2-1.2V20c0-8.837-7.163-16-16-16z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      
      {/* Ghost outline */}
      <path
        d="M24 4C15.163 4 8 11.163 8 20v14c0 1.5 1.2 2 2 1.2l3-2.4c.5-.4 1.2-.4 1.7 0l3.3 2.6c.5.4 1.2.4 1.7 0l4.3-3.4c.5-.4 1.2-.4 1.7 0l4.3 3.4c.5.4 1.2.4 1.7 0l3.3-2.6c.5-.4 1.2-.4 1.7 0l3 2.4c.8.8 2 .3 2-1.2V20c0-8.837-7.163-16-16-16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Left eye */}
      <circle cx="18" cy="20" r="2.5" fill="currentColor" />
      
      {/* Right eye */}
      <circle cx="30" cy="20" r="2.5" fill="currentColor" />
      
      {/* Quill/pen line through - writing motion */}
      <path
        d="M6 40L18 28"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 42l2-2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Alternative: More abstract, modern mark
export function GhostwriterMark({ className, size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-white', className)}
    >
      {/* Abstract G shape that looks like a ghost */}
      <path
        d="M38 24c0 7.732-6.268 14-14 14s-14-6.268-14-14S16.268 10 24 10c3.5 0 6.7 1.3 9.2 3.4"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Inner spiral - represents AI/thought */}
      <path
        d="M32 24c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      
      {/* Center dot - the "eye" */}
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      
      {/* Trailing wisps - ghost tail effect */}
      <path
        d="M14 38c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

// Minimal: Just the ghost silhouette
export function GhostwriterIcon({ className, size = 40 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('text-white', className)}
    >
      <defs>
        <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      {/* Ghost body filled */}
      <path
        d="M24 6C16.268 6 10 12.268 10 20v16l4-3 4 3 6-4 6 4 4-3 4 3V20c0-7.732-6.268-14-14-14z"
        fill="url(#ghostGrad)"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Eyes - slightly glowing effect */}
      <ellipse cx="19" cy="20" rx="2" ry="2.5" fill="currentColor" />
      <ellipse cx="29" cy="20" rx="2" ry="2.5" fill="currentColor" />
      
      {/* Subtle smile */}
      <path
        d="M20 27c2 2 6 2 8 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  )
}

export default GhostwriterLogo
