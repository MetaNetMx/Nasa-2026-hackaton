import { AbsoluteFill, random, useCurrentFrame } from 'remotion'

// 5x7 dot-matrix glyphs
const G: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '×': ['00000', '10001', '01010', '00100', '01010', '10001', '00000'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
}

export type DotProps = { value: string; color: string }

/** Perigee-style dot-matrix readout; dots switch on in a random cascade each time the value changes. */
export function DotNumber({ value, color }: DotProps) {
  const f = useCurrentFrame()
  const cell = 9, gap = 2
  return (
    <AbsoluteFill style={{ flexDirection: 'row', gap: cell, alignItems: 'center' }}>
      {value.split('').map((ch, gi) => (
        <div key={gi} style={{ display: 'grid', gridTemplateColumns: `repeat(5, ${cell}px)`, gap }}>
          {(G[ch] ?? G[' ']).flatMap((row, ri) =>
            row.split('').map((b, ci) => {
              const on = b === '1' && f > random(`${value}-${gi}-${ri}-${ci}`) * 18
              return <div key={`${ri}-${ci}`} style={{ width: cell, height: cell, borderRadius: '50%', background: on ? color : 'rgba(255,255,255,0.06)',
                boxShadow: on ? `0 0 8px ${color}` : 'none' }} />
            }),
          )}
        </div>
      ))}
    </AbsoluteFill>
  )
}
