import { ipcMain } from 'electron'

import type { CreateWorkspaceInput, UpdateWorkspaceInput, CreateWorktreeInput, CreateScreenInput } from 'shared/types'

import workspaceManager from './workspace-manager'

export function registerWorkspaceIPCs() {
  // List all workspaces
  ipcMain.handle('workspace-list', async () => {
    return await workspaceManager.list()
  })

  // Get workspace by ID
  ipcMain.handle('workspace-get', async (_event, id: string) => {
    return await workspaceManager.get(id)
  })

  // Create workspace
  ipcMain.handle('workspace-create', async (_event, input: CreateWorkspaceInput) => {
    return await workspaceManager.create(input)
  })

  // Update workspace
  ipcMain.handle('workspace-update', async (_event, input: UpdateWorkspaceInput) => {
    return await workspaceManager.update(input)
  })

  // Delete workspace
  ipcMain.handle('workspace-delete', async (_event, id: string, removeWorktree = false) => {
    return await workspaceManager.delete(id, removeWorktree)
  })

  // Get last opened workspace
  ipcMain.handle('workspace-get-last-opened', async () => {
    return await workspaceManager.getLastOpened()
  })

  // Create worktree
  ipcMain.handle('worktree-create', async (_event, input: CreateWorktreeInput) => {
    return await workspaceManager.createWorktree(input)
  })

  // Create screen
  ipcMain.handle('screen-create', async (_event, input: CreateScreenInput) => {
    return await workspaceManager.createScreen(input)
  })
}
