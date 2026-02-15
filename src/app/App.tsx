// @anchor: leaderboard/app/root
// @intent: Application shell that mounts route-level page composition.
import { LiveTimingPage } from '@/pages/live-timing'

/**
 * Root app component.
 * @returns Current application page composition.
 */
export function App() {
  return <LiveTimingPage />
}

export default App
