import { createContext } from 'react'

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface WorkspaceContextType {
  workspace: any
  fetchWorkspaceData: () => void
  labels: Label[]
  setLabels: (labels: Label[]) => void
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: null,
  fetchWorkspaceData: () => {},
  labels: [],
  setLabels: () => {}
})
