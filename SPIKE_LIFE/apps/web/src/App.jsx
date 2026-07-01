import { useState } from 'react'
import { leaveActiveRoom } from './lib/spike-life-workshop-client.js'
import PlayModeSelect from './components/PlayModeSelect.jsx'
import LifeWorkspace from './components/LifeWorkspace.jsx'
import WorkshopLobby from './components/workshop/WorkshopLobby.jsx'
import WorkshopWorkspace from './components/workshop/WorkshopWorkspace.jsx'

export default function App() {
  const [mode, setMode] = useState('pick')
  const [workshopSession, setWorkshopSession] = useState(null)

  if (mode === 'pick') {
    return (
      <PlayModeSelect
        onSolo={() => setMode('solo')}
        onMultiplayer={() => {
          setWorkshopSession(null)
          setMode('workshop')
        }}
      />
    )
  }

  if (mode === 'solo') {
    return (
      <LifeWorkspace
        onBack={() => setMode('pick')}
        onOpenWorkshop={() => {
          setWorkshopSession(null)
          setMode('workshop')
        }}
      />
    )
  }

  if (!workshopSession) {
    return (
      <WorkshopLobby
        onBack={() => setMode('pick')}
        onEnter={(session) => setWorkshopSession(session)}
      />
    )
  }

  return (
    <WorkshopWorkspace
      session={workshopSession}
      onExit={() => {
        leaveActiveRoom()
        setWorkshopSession(null)
        setMode('pick')
      }}
    />
  )
}
