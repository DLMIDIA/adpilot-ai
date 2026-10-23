/**
 * AdPilot AI - Webview Preload Script (Anti-Detection & Real Chrome Emulation)
 * Elimina rastros de automação e emula 100% o comportamento do Google Chrome real
 * para evitar loops de Captcha e rejeição de sessão na Meta, Facebook e Google Ads.
 */

// 1. Remover a flag navigator.webdriver (principal gatilho do Arkose Labs e Cloudflare)
try {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true
  });
} catch (e) {}

// 2. Emular objeto window.chrome nativo
try {
  if (!window.chrome) {
    window.chrome = {};
  }
  if (!window.chrome.runtime) {
    window.chrome.runtime = {
      connect: function() {},
      sendMessage: function() {},
      id: undefined
    };
  }
  if (!window.chrome.loadTimes) {
    window.chrome.loadTimes = function() {
      const now = Date.now() / 1000;
      return {
        commitLoadTime: now,
        connectionInfo: 'http/1.1',
        finishDocumentLoadTime: now,
        finishLoadTime: now,
        firstPaintAfterLoadTime: 0,
        firstPaintTime: now,
        navigationType: 'Other',
        npnNegotiatedProtocol: 'unknown',
        requestTime: now,
        startLoadTime: now,
        wasAlternateProtocolAvailable: false,
        wasFetchedViaSpdy: false,
        wasNpnNegotiated: false
      };
    };
  }
  if (!window.chrome.csi) {
    window.chrome.csi = function() {
      const now = Date.now();
      return {
        startE: now,
        onloadT: now + 180,
        pageT: 180,
        tran: 15
      };
    };
  }
  if (!window.chrome.app) {
    window.chrome.app = {
      isInstalled: false,
      InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
      RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
    };
  }
} catch (e) {}

// 3. Emular plugins nativos do Chrome (robôs têm 0 plugins)
try {
  if (!navigator.plugins || navigator.plugins.length === 0) {
    const fakePlugins = [
      { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
    ];
    Object.defineProperty(navigator, 'plugins', {
      get: () => fakePlugins,
      configurable: true
    });
  }
} catch (e) {}

// 4. Idiomas padrão do usuário no Brasil
try {
  Object.defineProperty(navigator, 'languages', {
    get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    configurable: true
  });
} catch (e) {}

// 5. Spoof de Permissões de Notificação
try {
  if (window.navigator && window.navigator.permissions) {
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => {
      if (parameters && parameters.name === 'notifications') {
        return Promise.resolve({
          state: window.Notification ? window.Notification.permission : 'default',
          onchange: null
        });
      }
      return originalQuery.apply(window.navigator.permissions, arguments);
    };
  }
} catch (e) {}
