import { createContext, useContext, useState, useEffect } from 'react'

const CustomAgentsContext = createContext()

export function CustomAgentsProvider({ children }) {
  const [customAgents, setCustomAgents] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem('customAgents')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage whenever customAgents changes
  useEffect(() => {
    localStorage.setItem('customAgents', JSON.stringify(customAgents))
  }, [customAgents])

  const addAgent = (agent) => {
    setCustomAgents(prev => [...prev, agent])
  }

  const updateAgent = (agentId, updatedAgent) => {
    setCustomAgents(prev => prev.map(a => a.id === agentId ? updatedAgent : a))
  }

  const deleteAgent = (agentId) => {
    setCustomAgents(prev => prev.filter(a => a.id !== agentId))
  }

  const duplicateAgent = (agent) => {
    const duplicated = {
      ...agent,
      id: `${agent.id}_copy`,
      name: `${agent.name} (Copy)`,
      createdAt: new Date().toISOString()
    }
    setCustomAgents(prev => [...prev, duplicated])
  }

  return (
    <CustomAgentsContext.Provider value={{
      customAgents,
      addAgent,
      updateAgent,
      deleteAgent,
      duplicateAgent
    }}>
      {children}
    </CustomAgentsContext.Provider>
  )
}

export function useCustomAgents() {
  const context = useContext(CustomAgentsContext)
  if (!context) {
    throw new Error('useCustomAgents must be used within CustomAgentsProvider')
  }
  return context
}