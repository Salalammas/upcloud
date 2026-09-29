import Start from './Start'
import Stage1 from './Stage1'
import Stage2 from './Stage2'
import Stage3 from './Stage3'
import Final from './Final'
import Finish from './Finish'

export const sections = [
  { id: 'start', label: 'START', Comp: Start },
  { id: 'stage1', label: 'STAGE 1', Comp: Stage1 },
  { id: 'stage2', label: 'STAGE 2', Comp: Stage2 },
  { id: 'stage3', label: 'STAGE 3', Comp: Stage3 },
  { id: 'final', label: 'FINAL', Comp: Final },
  { id: 'finish', label: 'FINISH', Comp: Finish },
]
