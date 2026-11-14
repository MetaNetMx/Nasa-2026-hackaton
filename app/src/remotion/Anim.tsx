import { Thumbnail } from '@remotion/player'
import { useEffect, useState, type ComponentType, type CSSProperties } from 'react'

type Props<T extends Record<string, unknown>> = {
  component: ComponentType<T>
  inputProps?: T
  durationInFrames: number
  width: number
  height: number
  style?: CSSProperties
}

const FPS = 30

/**
 * Plays a Remotion composition once and holds its last frame. Frames are driven by our own clock and
 * rendered with Remotion's <Thumbnail>, so playback never depends on browser autoplay rules.
 */
export function Anim<T extends Record<string, unknown>>({ component, inputProps, durationInFrames, width, height, style }: Props<T>) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const f = Math.min(durationInFrames - 1, Math.floor(((now - start) / 1000) * FPS))
      setFrame(f)
      if (f < durationInFrames - 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationInFrames])
  return (
    <Thumbnail
      component={component as ComponentType<Record<string, unknown>>}
      inputProps={(inputProps ?? {}) as Record<string, unknown>}
      compositionWidth={width}
      compositionHeight={height}
      frameToDisplay={frame}
      durationInFrames={durationInFrames}
      fps={FPS}
      style={style ?? { width, height }}
    />
  )
}
