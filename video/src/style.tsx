import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo'
import { loadFont as loadMono } from '@remotion/google-fonts/SpaceMono'
import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

const archivo = loadArchivo('normal', { weights: ['400', '700', '900'], subsets: ['latin'] })
const mono = loadMono('normal', { weights: ['400', '700'], subsets: ['latin'] })

export const C = { bg: '#141414', text: '#EDEDED', muted: '#8C8C8C', line: 'rgba(237,237,237,0.16)', accent: '#FF7A1A', bad: '#FF3355', good: '#3DDC84' }
export const SANS = archivo.fontFamily
export const MONO = mono.fontFamily
export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
export const ease = (f: number, a: number, b: number) => { const t = interpolate(f, [a, b], [0, 1], clamp); return 1 - Math.pow(1 - t, 3) }

/** Shared retro frame: charcoal, film grain, mono source tag top-left, page tag top-right. */
export function Frame({ tag, source, children }: { tag: string; source: string; children: ReactNode }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.text, fontFamily: SANS }}>
      <div style={{ position: 'absolute', top: 64, left: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.muted, opacity: ease(f, 0, 10) }}>
        <span style={{ background: '#0a0a0a', padding: '4px 10px' }}>[...]</span>{'  '}
        <span style={{ background: '#0a0a0a', padding: '4px 10px' }}>[DATA: <span style={{ color: C.accent }}>{source}</span>]</span>
      </div>
      <div style={{ position: 'absolute', top: 64, right: 96, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.muted, opacity: ease(f, 0, 10) }}>{tag}</div>
      {children}
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: 0.08, mixBlendMode: 'overlay',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='" + (f % 7) + "'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </AbsoluteFill>
  )
}

export function Headline({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  const f = useCurrentFrame()
  const k = ease(f, 2, 18)
  return (
    <div style={{ position: 'absolute', top: 120, left: 96, fontSize: 84, fontWeight: 900, fontStretch: '125%', letterSpacing: -1, lineHeight: 0.95,
      textTransform: 'uppercase', opacity: k, transform: `translateY(${(1 - k) * 24}px)`, ...style }}>
      {children}
    </div>
  )
}

export const Mono = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <span style={{ fontFamily: MONO, letterSpacing: 2, textTransform: 'uppercase', ...style }}>{children}</span>
)
