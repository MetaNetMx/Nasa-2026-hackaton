import { Composition, Series, Still } from 'remotion'
import { AppShot, Banner, EndCard, Title } from './cards'
import { CrewWide, McvDrop, Storm } from './clips'

const FPS = 30
/** All three data shots back to back (20 s), for a quick cut. */
function DataCut() {
  return (
    <Series>
      <Series.Sequence durationInFrames={8 * FPS}><McvDrop /></Series.Sequence>
      <Series.Sequence durationInFrames={6 * FPS}><CrewWide /></Series.Sequence>
      <Series.Sequence durationInFrames={6 * FPS}><Storm /></Series.Sequence>
    </Series>
  )
}

/** The full 30-second pitch: problem → finding → proof → product → storm → name. */
function Pitch30() {
  return (
    <Series>
      <Series.Sequence durationInFrames={3 * FPS}><Title /></Series.Sequence>
      <Series.Sequence durationInFrames={8 * FPS}><McvDrop /></Series.Sequence>
      <Series.Sequence durationInFrames={6 * FPS}><CrewWide /></Series.Sequence>
      <Series.Sequence durationInFrames={4 * FPS}><AppShot /></Series.Sequence>
      <Series.Sequence durationInFrames={6 * FPS}><Storm /></Series.Sequence>
      <Series.Sequence durationInFrames={3 * FPS}><EndCard /></Series.Sequence>
    </Series>
  )
}

export function Root() {
  const v = { fps: FPS, width: 1920, height: 1080 }
  return (
    <>
      <Composition id="McvDrop" component={McvDrop} durationInFrames={8 * FPS} {...v} />
      <Composition id="CrewWide" component={CrewWide} durationInFrames={6 * FPS} {...v} />
      <Composition id="Storm" component={Storm} durationInFrames={6 * FPS} {...v} />
      <Composition id="DataCut" component={DataCut} durationInFrames={20 * FPS} {...v} />
      <Composition id="Pitch30" component={Pitch30} durationInFrames={30 * FPS} {...v} />
      <Still id="Banner" component={Banner} width={1800} height={600} />
    </>
  )
}
