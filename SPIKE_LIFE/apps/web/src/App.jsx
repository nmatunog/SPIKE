import { useState } from 'react'
import { leaveActiveRoom } from './lib/spike-life-workshop-client.js'
import LifeWorkspace from './components/LifeWorkspace.jsx'
import WorkshopLobby from './components/workshop/WorkshopLobby.jsx'
import WorkshopWorkspace from './components/workshop/WorkshopWorkspace.jsx'

export default function App() {
  const [mode, setMode] = useState('solo')
  const [workshopSession, setWorkshopSession] = useState(null)

  if (mode === 'solo') {
    return (
      <LifeWorkspace
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
        onBack={() => setMode('solo')}
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
      }}
    />
  )
}
