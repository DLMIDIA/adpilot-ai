/**
 * AdPilot AI - Navegador Integrado Inteligente com Copiloto IA para Tráfego Pago
 * Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)
 *
 * Main Process com sessão Chromium persistente, cofre de senhas/credenciais,
 * gestão de clientes/empresas, agendamento de posts e API Google Gemini.
 */

const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Chave padrão carregada de variável de ambiente ou configuração local segura
const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const DEFAULT_MODEL = 'gemini-flash-latest';

function getConfigPath() {
  return path.join(app.getPath('userData'), 'adpilot_settings.json');
}

function getDefaultData() {
  return {
    settings: {
      geminiApiKey: DEFAULT_GEMINI_KEY,
      selectedModel: DEFAULT_MODEL,
      theme: 'dark',
      defaultUrl: 'https://adsmanager.facebook.com'
    },
    activeClientId: 'client-dl-midia',
    clients: [
      {
        id: 'client-dl-midia',
        name: 'DL MIDIA',
        niche: 'Agência de Marketing Digital & Tráfego Pago',
        offer: 'Gestão Completa de Tráfego Pago, Escala de Anúncios e IA para Vendas',
        audience: 'Empresários, e-commerces, clínicas e profissionais que desejam previsibilidade e vendas diárias',
        strategy: 'Captação ativa de clientes via Click-to-WhatsApp, anúncios com quebra de padrão em Reels e autoridade',
        goals: 'CPA máximo R$ 40,00 por lead qualificado, 60 reuniões comerciais no mês',
        notes: 'Nossa própria agência. Foco em posicionamento de alto valor, automações inteligentes e cases reais.'
      }
    ],
    credentials: [
      {
        id: 'cred-meta-dl',
        clientId: 'client-dl-midia',
        service: 'Meta Business Manager / Ads',
        accountName: 'DL MIDIA - BM Oficial',
        login: 'contato@dlmidia.com.br',
        password: '',
        twoFactorNotes: '2FA via aplicativo autenticador no smartphone do Daniel',
        link: 'https://business.facebook.com/select'
      },
      {
        id: 'cred-insta-dl',
        clientId: 'client-dl-midia',
        service: 'Instagram',
        accountName: '@dlmidia',
        login: 'contato@dlmidia.com.br',
        password: '',
        twoFactorNotes: 'Código SMS / App autenticador',
        link: 'https://www.instagram.com'
      }
    ],
    scheduledPosts: [
      {
        id: 'post-1',
        clientId: 'client-dl-midia',
        title: 'Como Reduzir o CPA em 40% no Meta Ads usando Ganchos de 3s',
        platform: 'Instagram Reels',
        date: '2026-10-25',
        time: '18:00',
        format: 'Vídeo / Reels',
        status: 'Roteirizado',
        hook: 'Se você ainda começa seus anúncios falando "Olá, meu nome é...", você está queimando 80% do seu orçamento.',
        caption: 'O algoritmo da Meta decide nos primeiros 3 segundos se o seu anúncio é relevante ou não. Aqui está a estrutura exata que usamos na DL MIDIA...'
      }
    ]
  };
}

function loadAppData() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      // Garantir compatibilidade de campos
      const defaultData = getDefaultData();
      return {
        settings: { ...defaultData.settings, ...(parsed.settings || {}) },
        activeClientId: parsed.activeClientId || defaultData.activeClientId,
        clients: parsed.clients || defaultData.clients,
        credentials: parsed.credentials || defaultData.credentials,
        scheduledPosts: parsed.scheduledPosts || defaultData.scheduledPosts
      };
    }
  } catch (err) {
    console.warn('Erro ao carregar dados salvos:', err);
  }
  const initial = getDefaultData();
  saveAppData(initial);
  return initial;
}

function saveAppData(data) {
  try {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    console.error('Erro ao salvar dados:', err);
    return { success: false, error: err.message };
  }
}

// User-Agent limpo para garantir compatibilidade com Facebook Ads e Google Ads
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

  const persistentSession = session.fromPartition('persist:adpilot_session');
  persistentSession.setUserAgent(CLEAN_CHROME_USER_AGENT);

  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = ['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write'];
    callback(allowed.includes(permission));
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===================================================================
// IPC Handlers: Armazenamento e Estado do Sistema
// ===================================================================

ipcMain.handle('storage:get-all', async () => {
  return loadAppData();
});

ipcMain.handle('storage:save-all', async (event, fullData) => {
  return saveAppData(fullData);
});

// Compatibilidade com chamadas anteriores
ipcMain.handle('storage:get-settings', async () => {
  const data = loadAppData();
  return data.settings;
});

ipcMain.handle('storage:save-settings', async (event, newSettings) => {
  const data = loadAppData();
  data.settings = { ...data.settings, ...newSettings };
  return saveAppData(data);
});

// ===================================================================
// IPC Handlers: Chamadas à API Google Gemini
// ===================================================================

ipcMain.handle('gemini:call', async (event, { apiKey, model, systemInstruction, prompt }) => {
  let chosenModel = model || DEFAULT_MODEL;
  // Corrige modelos descontinuados automaticamente para o recomendado da Google
  if (chosenModel === 'gemini-2.0-flash' || chosenModel === 'gemini-1.5-flash') {
    chosenModel = 'gemini-flash-latest';
  }

  const effectiveKey = (apiKey && apiKey.trim()) || DEFAULT_GEMINI_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${chosenModel}:generateContent?key=${encodeURIComponent(effectiveKey)}`;

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
        'Content-Type': 'application/json',
        'X-goog-api-key': effectiveKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        parsedError = errorJson.error?.message || errorText;
      } catch (e) {}
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
      model: data.modelVersion || chosenModel,
      usage: data.usageMetadata
    };
  } catch (err) {
    return {
      success: false,
      error: `Falha de conexão com a API Google Gemini: ${err.message}`
    };
  }
});

ipcMain.handle('gemini:test-key', async (event, { apiKey }) => {
  const effectiveKey = (apiKey && apiKey.trim()) || DEFAULT_GEMINI_KEY;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${encodeURIComponent(effectiveKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-goog-api-key': effectiveKey 
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Ping teste: responda "OK"' }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const modelVer = data.modelVersion || 'gemini-flash-latest';
      return { 
        success: true, 
        message: `Conexão com Google Gemini API (${modelVer}) validada com sucesso!` 
      };
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

// Abertura de links externos
ipcMain.handle('shell:open-external', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// Inicialização da Aplicação
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
