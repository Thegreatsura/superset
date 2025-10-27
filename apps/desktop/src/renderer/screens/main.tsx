import { useEffect, useState } from 'react'

import { Sidebar } from 'renderer/components/Sidebar'
import { TopBar } from 'renderer/components/TopBar'
import TerminalLayout from 'renderer/components/TerminalLayout'
import type { Workspace } from 'shared/types'

export function MainScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [selectedWorktreeId, setSelectedWorktreeId] = useState<string | null>(null)
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get selected screen details
  const selectedScreen = currentWorkspace?.worktrees
    ?.find((wt) => wt.id === selectedWorktreeId)
    ?.screens.find((s) => s.id === selectedScreenId)

  const selectedWorktree = currentWorkspace?.worktrees?.find((wt) => wt.id === selectedWorktreeId)

  const handleScreenSelect = (worktreeId: string, screenId: string) => {
    setSelectedWorktreeId(worktreeId)
    setSelectedScreenId(screenId)
  }

  const handleWorktreeCreated = async () => {
    // Refresh workspace data after worktree creation
    if (!currentWorkspace) return

    try {
      const refreshedWorkspace = (await window.ipcRenderer.invoke(
        'workspace-get',
        currentWorkspace.id
      )) as Workspace | null

      if (refreshedWorkspace) {
        setCurrentWorkspace(refreshedWorkspace)
      }
    } catch (error) {
      console.error('Failed to refresh workspace:', error)
    }
  }

  // Load last opened workspace on mount
  useEffect(() => {
    const loadLastWorkspace = async () => {
      try {
        setLoading(true)
        setError(null)
        const workspace = (await window.ipcRenderer.invoke(
          'workspace-get-last-opened'
        )) as Workspace | null

        if (workspace) {
          setCurrentWorkspace(workspace)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    loadLastWorkspace()
  }, [])

  // Listen for workspace-opened event from menu
  useEffect(() => {
    const handler = (workspace: Workspace) => {
      console.log('[MainScreen] Workspace opened event received:', workspace)
      setCurrentWorkspace(workspace)
      setLoading(false)
    }

    console.log('[MainScreen] Setting up workspace-opened listener')
    window.ipcRenderer.on('workspace-opened', handler)
    return () => {
      console.log('[MainScreen] Removing workspace-opened listener')
      window.ipcRenderer.off('workspace-opened', handler)
    }
  }, [])

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-300">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          workspace={currentWorkspace}
          onScreenSelect={handleScreenSelect}
          onWorktreeCreated={handleWorktreeCreated}
          selectedScreenId={selectedScreenId ?? undefined}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          workspaceName={currentWorkspace?.name}
          currentBranch={currentWorkspace?.branch}
        />

        {/* Content Area - Terminal Layout */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">Loading workspace...</div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full text-red-400">
              Error: {error}
            </div>
          )}

          {!loading && !error && !currentWorkspace && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="mb-4">No repository open</p>
              <p className="text-sm text-gray-500">
                Use <span className="font-mono">File → Open Repository...</span> or{' '}
                <span className="font-mono">Cmd+O</span> to get started
              </p>
            </div>
          )}

          {!loading && !error && currentWorkspace && !selectedScreen && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="mb-4">Select a worktree and screen to view terminals</p>
              <p className="text-sm text-gray-500">
                Create a worktree from the sidebar to get started
              </p>
            </div>
          )}

          {!loading && !error && selectedScreen && selectedWorktree && (
            <TerminalLayout layout={selectedScreen.layout} workingDirectory={selectedWorktree.path} />
          )}
        </div>
      </div>
    </div>
  )
}
