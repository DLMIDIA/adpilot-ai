/**
 * AdPilot AI - Preload Script
 * Expõe APIs seguras para o Renderer via contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('adpilot', {
  getSettings: () => ipcRenderer.invoke('storage:get-settings'),
  saveSettings: (data) => ipcRenderer.invoke('storage:save-settings', data),
  callGemini: (params) => ipcRenderer.invoke('gemini:call', params),
  testGeminiKey: (params) => ipcRenderer.invoke('gemini:test-key', params),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
});
