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
        <CheckpointBanner />
      </div>
    </>
  )
}
