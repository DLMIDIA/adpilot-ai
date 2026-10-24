/**
 * AdPilot AI - Preload Script
 * Expõe APIs seguras para o Renderer via contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('adpilot', {
  getAllData: () => ipcRenderer.invoke('storage:get-all'),
  saveAllData: (data) => ipcRenderer.invoke('storage:save-all', data),
  getSettings: () => ipcRenderer.invoke('storage:get-settings'),
  saveSettings: (data) => ipcRenderer.invoke('storage:save-settings', data),
  callGemini: (params) => ipcRenderer.invoke('gemini:call', params),
  testGeminiKey: (params) => ipcRenderer.invoke('gemini:test-key', params),
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('window:is-always-on-top'),
  testMetaToken: (params) => ipcRenderer.invoke('meta:test-token', params),
  fetchMetaInsights: (params) => ipcRenderer.invoke('meta:fetch-insights', params)
});
