import Speedometer from './Speedometer'
import StageTimer from './StageTimer'
import Minimap from './Minimap'
import CheckpointBanner from './CheckpointBanner'
import GlitchOverlay from './GlitchOverlay'

export default function Hud() {
  return (
    <>
      <GlitchOverlay />
      <div className="hud">
        <StageTimer />
        <Speedometer />
        <Minimap />
      </div>
      {/* Outside .hud so its z-index (60) applies at the root stacking level,
          above the glitch overlay (15) and scanlines (20). */}
      <CheckpointBanner />
    </>
  )
}
