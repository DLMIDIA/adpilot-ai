/**
 * AdPilot AI - Navegador Integrado Inteligente com Copiloto IA para Tráfego Pago
 * Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)
 *
 * Main Process do Electron com sessão Chromium persistente para Meta Ads,
 * Instagram, Google Ads e integração direta com a API do Google Gemini.
 */

const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Caminho do arquivo de configuração persistente
function getConfigPath() {
  return path.join(app.getPath('userData'), 'adpilot_settings.json');
}

function loadSavedSettings() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações salvas:', err);
  }
  return {
    geminiApiKey: '',
    selectedModel: 'gemini-2.0-flash',
    theme: 'dark',
    defaultUrl: 'https://adsmanager.facebook.com'
  };
}

function saveSettings(data) {
  try {
    const configPath = getConfigPath();
    const current = loadSavedSettings();
    const updated = { ...current, ...data };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
    return { success: true, settings: updated };
  } catch (err) {
    console.error('Erro ao salvar configurações:', err);
    return { success: false, error: err.message };
  }
}

// User-Agent limpo para evitar bloqueio do Meta Ads Manager / Google Ads por "Electron"
const CLEAN_CHROME_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1100,
    minHeight: 700,
    title: 'AdPilot AI — Tráfego Pago & Meta Ads Copilot',
    backgroundColor: '#0b0f19',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Configuração da partição persistente para o Chromium embutido
  const persistentSession = session.fromPartition('persist:adpilot_session');
  persistentSession.setUserAgent(CLEAN_CHROME_USER_AGENT);

  // Permissões padrão para anúncios (áudio, câmera/mic se necessário em prévias de criativos)
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write'];
    callback(allowed.includes(permission));
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers

// 1. Obter e Salvar Configurações
ipcMain.handle('storage:get-settings', async () => {
  return loadSavedSettings();
});

ipcMain.handle('storage:save-settings', async (event, data) => {
  return saveSettings(data);
});

// 2. Chamar API Google Gemini
ipcMain.handle('gemini:call', async (event, { apiKey, model, systemInstruction, prompt }) => {
  const chosenModel = model || 'gemini-2.0-flash';
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Chave de API do Google Gemini não configurada. Por favor, acesse a aba "Configurações" e insira sua chave.'
    };
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error?.message || errorText;
      } catch (e) {
        // use raw errorText
      }
      return {
        success: false,
        error: `Erro Google Gemini (${response.status}): ${parsedError}`
      };
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nenhuma resposta gerada.';

    return {
      success: true,
      text: textOutput,
      model: chosenModel,
      usage: data.usageMetadata
    };
  } catch (err) {
    return {
      success: false,
      error: `Falha de conexão com a API Google Gemini: ${err.message}`
    };
  }
});

// 3. Testar Chave do Gemini
ipcMain.handle('gemini:test-key', async (event, { apiKey }) => {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: 'Chave de API vazia.' };
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping teste: responda "OK"' }] }]
      })
    });

    if (response.ok) {
      return { success: true, message: 'Conexão com a Google Gemini API validada com sucesso!' };
    } else {
      const err = await response.text();
      let msg = err;
      try {
        const parsed = JSON.parse(err);
        msg = parsed.error?.message || err;
      } catch (e) {}
      return { success: false, message: `Chave recusada (${response.status}): ${msg}` };
    }
  } catch (err) {
    return { success: false, message: `Erro ao conectar: ${err.message}` };
  }
});

// 4. Abrir Links Externos no Navegador Padrão do Sistema
ipcMain.handle('shell:open-external', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// Inicialização do App
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
