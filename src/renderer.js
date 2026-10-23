/**
 * AdPilot AI - Renderer Process
 * Gerencia o Navegador Chromium, Copiloto IA, Gestão de Clientes,
 * Cofre de Credenciais e Agendador de Conteúdo
 * Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)
 */

import { SYSTEM_PROMPTS, buildClientContext, generateLocalFallback } from './services/geminiService.js';
import { 
  calculateBreakEvenRoas, 
  calculateCpaTargets, 
  evaluateKillOrScale, 
  buildUtmUrl 
} from './services/marketingTools.js';

// Estado Global da Aplicação
let appState = {
  settings: {
    geminiApiKey: '',
    selectedModel: 'gemini-flash-latest',
    theme: 'dark',
    defaultUrl: 'https://adsmanager.facebook.com'
  },
  activeClientId: 'client-dl-midia',
  clients: [],
  credentials: [],
  scheduledPosts: []
};

// Elementos da Interface
const webview = document.getElementById('main-webview');
const webviewLoader = document.getElementById('webview-loader');
const urlInput = document.getElementById('url-input');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const btnReload = document.getElementById('btn-reload');
const btnHome = document.getElementById('btn-home');
const btnGo = document.getElementById('btn-go');
const btnToggleSplit = document.getElementById('btn-toggle-split');
const panelBrowser = document.getElementById('panel-browser');
const panelCopilot = document.getElementById('panel-copilot');
const activeModelTag = document.getElementById('active-model-tag');
const footerStatus = document.getElementById('footer-status');
const footerClientName = document.getElementById('footer-client-name');
const globalClientSelect = document.getElementById('global-client-select');

// ===================================================================
// 1. Inicialização & Carregamento de Dados
// ===================================================================
async function initApp() {
  try {
    if (window.adpilot) {
      const fullData = await window.adpilot.getAllData();
      if (fullData) {
        appState = {
          ...appState,
          ...fullData,
          settings: { ...appState.settings, ...(fullData.settings || {}) }
        };
      }
    }
  } catch (err) {
    console.error('Erro ao carregar dados do sistema:', err);
  }

  // Preencher campos da tela de ajustes
  const keyInput = document.getElementById('settings-gemini-key');
  const modelSelect = document.getElementById('settings-model');
  if (keyInput) keyInput.value = appState.settings.geminiApiKey || '';
  if (modelSelect) modelSelect.value = appState.settings.selectedModel || 'gemini-flash-latest';

  setupWebview();
  setupNavigation();
  setupTabs();
  setupGlobalClientSync();
  renderClients();
  renderCredentials();
  renderScheduledPosts();
  setupChat();
  setupAudit();
  setupCopyEngine();
  setupCalculators();
  setupSettingsUI();
  updateModelTag();
}

async function persistState() {
  if (window.adpilot) {
    await window.adpilot.saveAllData(appState);
  }
}

function getActiveClient() {
  return appState.clients.find(c => c.id === appState.activeClientId) || appState.clients[0] || null;
}

function updateModelTag() {
  if (activeModelTag) {
    const model = appState.settings.selectedModel || 'gemini-flash-latest';
    const hasKey = !!(appState.settings.geminiApiKey && appState.settings.geminiApiKey.trim());
    activeModelTag.textContent = hasKey ? `${model} (Ativo)` : 'Modo Heurístico';
    activeModelTag.style.borderColor = hasKey ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)';
  }
}

// ===================================================================
// 2. Sincronização Global do Cliente Ativo
// ===================================================================
function setupGlobalClientSync() {
  updateGlobalClientDropdown();

  globalClientSelect?.addEventListener('change', () => {
    appState.activeClientId = globalClientSelect.value;
    persistState();
    renderClients();
    updateFooterClient();
  });

  updateFooterClient();
}

function updateGlobalClientDropdown() {
  if (!globalClientSelect) return;
  globalClientSelect.innerHTML = '';

  appState.clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === appState.activeClientId) opt.selected = true;
    globalClientSelect.appendChild(opt);
  });

  // Atualiza também os selects dos formulários de credenciais e posts
  const credClientSelect = document.getElementById('cred-form-client');
  const postClientSelect = document.getElementById('post-form-client');
  const vaultFilterSelect = document.getElementById('vault-filter-client');

  if (credClientSelect) {
    credClientSelect.innerHTML = '';
    appState.clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      credClientSelect.appendChild(opt);
    });
  }

  if (postClientSelect) {
    postClientSelect.innerHTML = '';
    appState.clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      postClientSelect.appendChild(opt);
    });
  }

  if (vaultFilterSelect) {
    vaultFilterSelect.innerHTML = '<option value="ALL">Todas Empresas</option>';
    appState.clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      vaultFilterSelect.appendChild(opt);
    });
  }
}

function updateFooterClient() {
  const active = getActiveClient();
  if (footerClientName) {
    footerClientName.textContent = active ? active.name : 'DL MIDIA';
  }
}

// ===================================================================
// 3. Gestão de Empresas & Clientes
// ===================================================================
function renderClients() {
  const container = document.getElementById('clients-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (appState.clients.length === 0) {
    container.innerHTML = '<div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 20px;">Nenhuma empresa cadastrada. Clique em "+ Nova Empresa" acima.</div>';
    return;
  }

  appState.clients.forEach(c => {
    const isActive = c.id === appState.activeClientId;
    const card = document.createElement('div');
    card.className = `client-card ${isActive ? 'active-client-border' : ''}`;

    card.innerHTML = `
      <div class="client-card-header">
        <div class="client-name">
          <span>${c.name}</span>
          ${isActive ? '<span class="status-ready" style="font-size: 9px; padding: 1px 6px;">Ativo</span>' : ''}
        </div>
        <span class="client-niche-tag">${c.niche || 'Geral'}</span>
      </div>

      <div class="client-info-row"><strong>Oferta:</strong> ${c.offer || 'Não informada'}</div>
      <div class="client-info-row"><strong>Público:</strong> ${c.audience || 'Não informado'}</div>
      <div class="client-info-row"><strong>Estratégia:</strong> ${c.strategy || 'Não definida'}</div>
      <div class="client-info-row"><strong>Metas:</strong> ${c.goals || 'CPA baixo'}</div>
      ${c.notes ? `<div class="client-info-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.08);"><strong>Orientação / Briefing:</strong> ${c.notes}</div>` : ''}

      <div style="display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end;">
        ${!isActive ? `<button class="btn-secondary btn-select-client" data-id="${c.id}" style="font-size: 11px; padding: 3px 8px;">Definir como Ativo</button>` : ''}
        <button class="btn-secondary btn-edit-client" data-id="${c.id}" style="font-size: 11px; padding: 3px 8px;">Editar</button>
        ${c.id !== 'client-dl-midia' ? `<button class="btn-danger btn-delete-client" data-id="${c.id}" style="font-size: 10px; padding: 3px 6px;">Excluir</button>` : ''}
      </div>
    `;

    // Eventos
    card.querySelector('.btn-select-client')?.addEventListener('click', () => {
      appState.activeClientId = c.id;
      persistState();
      updateGlobalClientDropdown();
      renderClients();
      updateFooterClient();
    });

    card.querySelector('.btn-edit-client')?.addEventListener('click', () => {
      openClientForm(c);
    });

    card.querySelector('.btn-delete-client')?.addEventListener('click', () => {
      if (confirm(`Deseja remover a empresa "${c.name}"?`)) {
        appState.clients = appState.clients.filter(item => item.id !== c.id);
        if (appState.activeClientId === c.id) {
          appState.activeClientId = appState.clients[0]?.id || '';
        }
        persistState();
        updateGlobalClientDropdown();
        renderClients();
        updateFooterClient();
      }
    });

    container.appendChild(card);
  });
}

function openClientForm(client = null) {
  const formCard = document.getElementById('client-form-card');
  const title = document.getElementById('client-form-title');
  const idInput = document.getElementById('client-form-id');
  const nameInput = document.getElementById('client-form-name');
  const nicheInput = document.getElementById('client-form-niche');
  const offerInput = document.getElementById('client-form-offer');
  const audienceInput = document.getElementById('client-form-audience');
  const strategyInput = document.getElementById('client-form-strategy');
  const goalsInput = document.getElementById('client-form-goals');
  const notesInput = document.getElementById('client-form-notes');

  formCard.style.display = 'block';

  if (client) {
    title.textContent = 'Editar Empresa';
    idInput.value = client.id;
    nameInput.value = client.name || '';
    nicheInput.value = client.niche || '';
    offerInput.value = client.offer || '';
    audienceInput.value = client.audience || '';
    strategyInput.value = client.strategy || '';
    goalsInput.value = client.goals || '';
    notesInput.value = client.notes || '';
  } else {
    title.textContent = 'Cadastrar Nova Empresa';
    idInput.value = '';
    nameInput.value = '';
    nicheInput.value = '';
    offerInput.value = '';
    audienceInput.value = '';
    strategyInput.value = '';
    goalsInput.value = '';
    notesInput.value = '';
  }

  nameInput.focus();
}

document.getElementById('btn-toggle-client-form')?.addEventListener('click', () => {
  openClientForm(null);
});

document.getElementById('btn-cancel-client-form')?.addEventListener('click', () => {
  document.getElementById('client-form-card').style.display = 'none';
});

document.getElementById('btn-save-client')?.addEventListener('click', () => {
  const id = document.getElementById('client-form-id').value;
  const name = document.getElementById('client-form-name').value.trim();
  if (!name) {
    alert('Informe o nome da empresa.');
    return;
  }

  const clientData = {
    id: id || `client-${Date.now()}`,
    name,
    niche: document.getElementById('client-form-niche').value.trim(),
    offer: document.getElementById('client-form-offer').value.trim(),
    audience: document.getElementById('client-form-audience').value.trim(),
    strategy: document.getElementById('client-form-strategy').value.trim(),
    goals: document.getElementById('client-form-goals').value.trim(),
    notes: document.getElementById('client-form-notes').value.trim()
  };

  const existingIndex = appState.clients.findIndex(c => c.id === clientData.id);
  if (existingIndex >= 0) {
    appState.clients[existingIndex] = clientData;
  } else {
    appState.clients.push(clientData);
    appState.activeClientId = clientData.id;
  }

  persistState();
  document.getElementById('client-form-card').style.display = 'none';
  updateGlobalClientDropdown();
  renderClients();
  updateFooterClient();
});

// ===================================================================
// 4. Cofre de Credenciais & Senhas
// ===================================================================
function renderCredentials() {
  const container = document.getElementById('credentials-list-container');
  const search = (document.getElementById('vault-search-input')?.value || '').toLowerCase();
  const filterClient = document.getElementById('vault-filter-client')?.value || 'ALL';

  if (!container) return;
  container.innerHTML = '';

  let list = appState.credentials;

  if (filterClient !== 'ALL') {
    list = list.filter(c => c.clientId === filterClient);
  }

  if (search) {
    list = list.filter(c => 
      (c.service || '').toLowerCase().includes(search) ||
      (c.accountName || '').toLowerCase().includes(search) ||
      (c.login || '').toLowerCase().includes(search)
    );
  }

  if (list.length === 0) {
    container.innerHTML = '<div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 20px;">Nenhuma credencial encontrada.</div>';
    return;
  }

  list.forEach(cred => {
    const client = appState.clients.find(c => c.id === cred.clientId);
    const clientName = client ? client.name : 'Geral';
    const card = document.createElement('div');
    card.className = 'credential-card';

    card.innerHTML = `
      <div class="credential-header">
        <span class="service-badge">${escapeHtml(cred.service || 'Acesso')}</span>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">🏢 ${escapeHtml(clientName)}</span>
      </div>

      <div style="font-size: 12.5px; font-weight: 700; color: #fff;">${escapeHtml(cred.accountName || 'Conta')}</div>

      <div class="credential-fields">
        <div class="cred-box">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(cred.login)}">${escapeHtml(cred.login || 'Sem login')}</span>
          <button class="btn-secondary btn-copy-login" style="font-size: 10px; padding: 2px 5px;">Copiar</button>
        </div>

        <div class="cred-box">
          <span class="cred-pass-display cred-value-masked" data-pass="${escapeHtml(cred.password || '')}">••••••••</span>
          <div style="display: flex; gap: 3px;">
            <button class="btn-secondary btn-toggle-pass" style="font-size: 10px; padding: 2px 5px;" title="Mostrar/Ocultar Senha">👁️</button>
            <button class="btn-secondary btn-copy-pass" style="font-size: 10px; padding: 2px 5px;">Copiar</button>
          </div>
        </div>
      </div>

      ${cred.twoFactorNotes ? `
        <div style="font-size: 11px; color: #fde68a; background: var(--warning-bg); border-left: 2px solid var(--warning); padding: 4px 8px; border-radius: 3px;">
          🔑 <strong>2FA / Notas:</strong> ${escapeHtml(cred.twoFactorNotes)}
        </div>
      ` : ''}

      <div class="cred-actions-bar">
        <div style="display: flex; gap: 5px;">
          ${cred.link ? `<button class="btn-primary btn-open-chrome-cred" data-url="${escapeHtml(cred.link)}" style="font-size: 11px; padding: 3px 8px; background: linear-gradient(135deg, #10b981 0%, #059669 100%);" title="Abrir no Google Chrome Oficial (Sem bloqueios de 2FA ou Captcha)">🚀 Abrir no Chrome</button>` : ''}
          ${cred.link ? `<button class="btn-secondary btn-open-cred-link" data-url="${escapeHtml(cred.link)}" style="font-size: 11px; padding: 3px 6px;" title="Abrir na visualização interna do app">📱 No App</button>` : ''}
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="btn-secondary btn-edit-cred" data-id="${cred.id}" style="font-size: 10px; padding: 2px 6px;">Editar</button>
          <button class="btn-danger btn-delete-cred" data-id="${cred.id}" style="font-size: 10px; padding: 2px 5px;">Excluir</button>
        </div>
      </div>
    `;

    // Eventos da credencial
    card.querySelector('.btn-copy-login')?.addEventListener('click', (e) => {
      copyToClipboard(cred.login, e.target, 'Copiado!');
    });

    const passSpan = card.querySelector('.cred-pass-display');
    const btnTogglePass = card.querySelector('.btn-toggle-pass');
    let passVisible = false;

    btnTogglePass?.addEventListener('click', () => {
      passVisible = !passVisible;
      if (passVisible) {
        passSpan.textContent = cred.password || '(vazia)';
        passSpan.classList.remove('cred-value-masked');
      } else {
        passSpan.textContent = '••••••••';
        passSpan.classList.add('cred-value-masked');
      }
    });

    card.querySelector('.btn-copy-pass')?.addEventListener('click', (e) => {
      copyToClipboard(cred.password, e.target, 'Copiado!');
    });

    card.querySelector('.btn-open-chrome-cred')?.addEventListener('click', () => {
      if (cred.link && window.adpilot) {
        window.adpilot.openExternal(cred.link);
      }
    });

    card.querySelector('.btn-open-cred-link')?.addEventListener('click', () => {
      navigateTo(cred.link);
    });

    card.querySelector('.btn-edit-cred')?.addEventListener('click', () => {
      openCredForm(cred);
    });

    card.querySelector('.btn-delete-cred')?.addEventListener('click', () => {
      if (confirm(`Remover as credenciais de "${cred.accountName}"?`)) {
        appState.credentials = appState.credentials.filter(c => c.id !== cred.id);
        persistState();
        renderCredentials();
      }
    });

    container.appendChild(card);
  });
}

function openCredForm(cred = null) {
  const formCard = document.getElementById('cred-form-card');
  const title = document.getElementById('cred-form-title');
  const idInput = document.getElementById('cred-form-id');
  const clientSelect = document.getElementById('cred-form-client');
  const serviceSelect = document.getElementById('cred-form-service');
  const nameInput = document.getElementById('cred-form-name');
  const loginInput = document.getElementById('cred-form-login');
  const passwordInput = document.getElementById('cred-form-password');
  const twoFactorInput = document.getElementById('cred-form-twofactor');
  const linkInput = document.getElementById('cred-form-link');

  formCard.style.display = 'block';

  if (cred) {
    title.textContent = 'Editar Credencial';
    idInput.value = cred.id;
    clientSelect.value = cred.clientId || appState.activeClientId;
    serviceSelect.value = cred.service || 'Meta Business Manager / Ads';
    nameInput.value = cred.accountName || '';
    loginInput.value = cred.login || '';
    passwordInput.value = cred.password || '';
    twoFactorInput.value = cred.twoFactorNotes || '';
    linkInput.value = cred.link || '';
  } else {
    title.textContent = 'Adicionar Nova Credencial';
    idInput.value = '';
    clientSelect.value = appState.activeClientId;
    nameInput.value = '';
    loginInput.value = '';
    passwordInput.value = '';
    twoFactorInput.value = '';
    linkInput.value = 'https://business.facebook.com';
  }

  nameInput.focus();
}

document.getElementById('btn-toggle-cred-form')?.addEventListener('click', () => openCredForm(null));
document.getElementById('btn-cancel-cred-form')?.addEventListener('click', () => {
  document.getElementById('cred-form-card').style.display = 'none';
});

document.getElementById('btn-save-cred')?.addEventListener('click', () => {
  const id = document.getElementById('cred-form-id').value;
  const name = document.getElementById('cred-form-name').value.trim();
  const login = document.getElementById('cred-form-login').value.trim();

  if (!name && !login) {
    alert('Informe ao menos o nome da conta ou login.');
    return;
  }

  const credData = {
    id: id || `cred-${Date.now()}`,
    clientId: document.getElementById('cred-form-client').value,
    service: document.getElementById('cred-form-service').value,
    accountName: name || 'Conta sem nome',
    login: login,
    password: document.getElementById('cred-form-password').value,
    twoFactorNotes: document.getElementById('cred-form-twofactor').value.trim(),
    link: document.getElementById('cred-form-link').value.trim()
  };

  const idx = appState.credentials.findIndex(c => c.id === credData.id);
  if (idx >= 0) {
    appState.credentials[idx] = credData;
  } else {
    appState.credentials.push(credData);
  }

  persistState();
  document.getElementById('cred-form-card').style.display = 'none';
  renderCredentials();
});

document.getElementById('vault-search-input')?.addEventListener('input', renderCredentials);
document.getElementById('vault-filter-client')?.addEventListener('change', renderCredentials);

// ===================================================================
// 5. Agendador Inteligente de Conteúdos & Posts
// ===================================================================
function renderScheduledPosts() {
  const container = document.getElementById('posts-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (appState.scheduledPosts.length === 0) {
    container.innerHTML = '<div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 20px;">Nenhum post agendado. Clique em "+ Novo Post" para planejar.</div>';
    return;
  }

  appState.scheduledPosts.forEach(post => {
    const client = appState.clients.find(c => c.id === post.clientId);
    const clientName = client ? client.name : 'Geral';
    const card = document.createElement('div');
    card.className = 'post-card';

    let statusClass = 'status-idea';
    if (post.status === 'Roteirizado') statusClass = 'status-script';
    if (post.status === 'Gravado') statusClass = 'status-recorded';
    if (post.status === 'Agendado') statusClass = 'status-ready';
    if (post.status === 'Publicado') statusClass = 'status-published';

    card.innerHTML = `
      <div class="post-header">
        <span class="post-status-badge ${statusClass}">${escapeHtml(post.status || 'Ideia')}</span>
        <span style="font-size: 11px; color: var(--text-muted);">🏢 ${escapeHtml(clientName)} • 📅 ${escapeHtml(post.date || 'Sem data')} ${post.time ? `às ${post.time}` : ''}</span>
      </div>

      <div style="font-size: 13px; font-weight: 700; color: #fff;">${escapeHtml(post.title)}</div>
      <div style="font-size: 11px; color: #a5b4fc;">📌 Plataforma: ${escapeHtml(post.platform)}</div>

      ${post.hook ? `
        <div class="post-hook-box">
          <strong>🎣 Gancho (0-3s):</strong> ${escapeHtml(post.hook)}
        </div>
      ` : ''}

      ${post.caption ? `
        <div class="post-body" style="max-height: 80px; overflow-y: auto; background: var(--bg-surface); padding: 6px; border-radius: 4px;">
          ${escapeHtml(post.caption)}
        </div>
      ` : ''}

      <div style="display: flex; gap: 6px; margin-top: 6px; justify-content: flex-end;">
        ${post.caption ? `<button class="btn-secondary btn-copy-caption" style="font-size: 10px; padding: 2px 6px;">Copiar Legenda</button>` : ''}
        <button class="btn-secondary btn-edit-post" data-id="${post.id}" style="font-size: 10px; padding: 2px 6px;">Editar</button>
        <button class="btn-danger btn-delete-post" data-id="${post.id}" style="font-size: 10px; padding: 2px 6px;">Excluir</button>
      </div>
    `;

    card.querySelector('.btn-copy-caption')?.addEventListener('click', (e) => {
      copyToClipboard(post.caption, e.target, 'Copiado!');
    });

    card.querySelector('.btn-edit-post')?.addEventListener('click', () => {
      openPostForm(post);
    });

    card.querySelector('.btn-delete-post')?.addEventListener('click', () => {
      if (confirm(`Remover post "${post.title}"?`)) {
        appState.scheduledPosts = appState.scheduledPosts.filter(p => p.id !== post.id);
        persistState();
        renderScheduledPosts();
      }
    });

    container.appendChild(card);
  });
}

function openPostForm(post = null) {
  const formCard = document.getElementById('post-form-card');
  const title = document.getElementById('post-form-title');
  const idInput = document.getElementById('post-form-id');
  const clientSelect = document.getElementById('post-form-client');
  const nameInput = document.getElementById('post-form-name');
  const platformSelect = document.getElementById('post-form-platform');
  const statusSelect = document.getElementById('post-form-status');
  const dateInput = document.getElementById('post-form-date');
  const timeInput = document.getElementById('post-form-time');
  const hookInput = document.getElementById('post-form-hook');
  const captionInput = document.getElementById('post-form-caption');

  formCard.style.display = 'block';

  if (post) {
    title.textContent = 'Editar Post Agendado';
    idInput.value = post.id;
    clientSelect.value = post.clientId || appState.activeClientId;
    nameInput.value = post.title || '';
    platformSelect.value = post.platform || 'Instagram Reels';
    statusSelect.value = post.status || 'Ideia';
    dateInput.value = post.date || '';
    timeInput.value = post.time || '18:00';
    hookInput.value = post.hook || '';
    captionInput.value = post.caption || '';
  } else {
    title.textContent = 'Planejar Novo Post';
    idInput.value = '';
    clientSelect.value = appState.activeClientId;
    nameInput.value = '';
    platformSelect.value = 'Instagram Reels';
    statusSelect.value = 'Ideia';
    
    // Data de hoje
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    timeInput.value = '18:00';
    hookInput.value = '';
    captionInput.value = '';
  }

  nameInput.focus();
}

document.getElementById('btn-toggle-post-form')?.addEventListener('click', () => openPostForm(null));
document.getElementById('btn-cancel-post-form')?.addEventListener('click', () => {
  document.getElementById('post-form-card').style.display = 'none';
});

document.getElementById('btn-save-post')?.addEventListener('click', () => {
  const id = document.getElementById('post-form-id').value;
  const title = document.getElementById('post-form-name').value.trim();
  if (!title) {
    alert('Informe o título ou tema do post.');
    return;
  }

  const postData = {
    id: id || `post-${Date.now()}`,
    clientId: document.getElementById('post-form-client').value,
    title: title,
    platform: document.getElementById('post-form-platform').value,
    status: document.getElementById('post-form-status').value,
    date: document.getElementById('post-form-date').value,
    time: document.getElementById('post-form-time').value,
    hook: document.getElementById('post-form-hook').value.trim(),
    caption: document.getElementById('post-form-caption').value.trim()
  };

  const idx = appState.scheduledPosts.findIndex(p => p.id === postData.id);
  if (idx >= 0) {
    appState.scheduledPosts[idx] = postData;
  } else {
    appState.scheduledPosts.push(postData);
  }

  persistState();
  document.getElementById('post-form-card').style.display = 'none';
  renderScheduledPosts();
});

// Geração de Roteiro e Legenda com IA
document.getElementById('btn-ai-generate-post')?.addEventListener('click', async () => {
  const btn = document.getElementById('btn-ai-generate-post');
  const title = document.getElementById('post-form-name').value.trim();
  const platform = document.getElementById('post-form-platform').value;
  const clientId = document.getElementById('post-form-client').value;
  const client = appState.clients.find(c => c.id === clientId) || getActiveClient();

  if (!title) {
    alert('Digite o título/tema do post antes de gerar com IA.');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Criando Roteiro...';

  const prompt = `Crie o roteiro e legenda completa para o seguinte post:
- Título/Pauta: ${title}
- Plataforma/Formato: ${platform}
- Empresa: ${client ? client.name : 'DL MIDIA'}
- Nicho: ${client ? client.niche : 'Marketing / Negócios'}
- Oferta/Objetivo: ${client ? client.offer : 'Conversão'}
- Persona/Dores: ${client ? client.audience : 'Empresários'}

Estruture com:
1. Frase do Gancho (Hook de 0-3 segundos).
2. Desenvolvimento/Roteiro visual.
3. Legenda pronta com hashtags estratégicas e CTA para o Direct/WhatsApp.`;

  try {
    let outputText = '';
    if (appState.settings.geminiApiKey) {
      const response = await window.adpilot.callGemini({
        apiKey: appState.settings.geminiApiKey,
        model: appState.settings.selectedModel,
        systemInstruction: SYSTEM_PROMPTS.POST_SCHEDULER + buildClientContext(client),
        prompt: prompt
      });
      outputText = response.success ? response.text : generateLocalFallback('post', { title, platform });
    } else {
      outputText = generateLocalFallback('post', { title, platform });
    }

    // Tentar extrair o gancho automaticamente
    let extractedHook = '';
    const hookMatch = outputText.match(/Gancho[^:]*:?\s*[\*\"]*([^\n\*\"]+)[\*\"]*/i);
    if (hookMatch && hookMatch[1]) {
      extractedHook = hookMatch[1].trim();
    } else {
      extractedHook = `O maior erro ao falar sobre ${title}...`;
    }

    document.getElementById('post-form-hook').value = extractedHook;
    document.getElementById('post-form-caption').value = outputText;
    document.getElementById('post-form-status').value = 'Roteirizado';
  } catch (err) {
    alert(`Erro ao gerar roteiro: ${err.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Roteirizar com IA';
  }
});

// ===================================================================
// 6. Controle do Navegador Chromium (Webview)
// ===================================================================
function setupWebview() {
  if (!webview) return;

  webview.addEventListener('did-start-loading', () => {
    if (webviewLoader) webviewLoader.style.display = 'block';
    if (footerStatus) footerStatus.textContent = 'Carregando página...';
  });

  webview.addEventListener('did-stop-loading', () => {
    if (webviewLoader) webviewLoader.style.display = 'none';
    if (footerStatus) footerStatus.textContent = 'Pronto';
  });

  // Captura popups e janelas OAuth/2FA/Captcha e mantém na mesma sessão
  webview.addEventListener('new-window', (e) => {
    const url = e.url;
    if (url && (url.includes('facebook.com') || url.includes('instagram.com') || url.includes('meta.com') || url.includes('google.com'))) {
      if (url.includes('checkpoint') || url.includes('login') || url.includes('challenge') || url.includes('auth')) {
        webview.src = url;
        return;
      }
    }
    window.open(url, '_blank');
  });

  // Injeção de reforço anti-detecção
  webview.addEventListener('dom-ready', () => {
    webview.executeJavaScript(`
      try {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true });
        if (!window.chrome) { window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} }; }
      } catch (e) {}
    `).catch(() => {});
  });

  const updateUrlField = () => {
    try {
      const currentUrl = webview.getURL();
      if (currentUrl && currentUrl !== 'about:blank') {
        urlInput.value = currentUrl;
        highlightActivePreset(currentUrl);
      }
    } catch (e) {}
  };

  webview.addEventListener('did-navigate', updateUrlField);
  webview.addEventListener('did-navigate-in-page', updateUrlField);
}

function setupNavigation() {
  btnBack?.addEventListener('click', () => {
    if (webview && webview.canGoBack()) webview.goBack();
  });

  btnForward?.addEventListener('click', () => {
    if (webview && webview.canGoForward()) webview.goForward();
  });

  btnReload?.addEventListener('click', () => {
    if (webview) webview.reload();
  });

  btnHome?.addEventListener('click', () => {
    navigateTo('https://adsmanager.facebook.com');
  });

  const handleNavigate = () => {
    let url = urlInput.value.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
      }
    }
    navigateTo(url);
  };

  btnGo?.addEventListener('click', handleNavigate);
  urlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleNavigate();
  });

  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetUrl = chip.getAttribute('data-url');
      if (targetUrl) navigateTo(targetUrl);
    });
  });

  // Botão "Abrir no Chrome Oficial"
  const btnOpenChrome = document.getElementById('btn-open-in-chrome');
  btnOpenChrome?.addEventListener('click', () => {
    let currentUrl = urlInput?.value?.trim() || 'https://adsmanager.facebook.com';
    if (!currentUrl.startsWith('http://') && !currentUrl.startsWith('https://')) {
      currentUrl = 'https://' + currentUrl;
    }
    if (window.adpilot) {
      window.adpilot.openExternal(currentUrl);
      if (footerStatus) {
        footerStatus.textContent = '🚀 Aberto no Google Chrome Oficial!';
        setTimeout(() => { if (footerStatus) footerStatus.textContent = 'Pronto'; }, 3000);
      }
    }
  });

  // Botão "Fixar Janela" (Always on Top)
  const btnPin = document.getElementById('btn-pin-window');
  btnPin?.addEventListener('click', async () => {
    if (window.adpilot) {
      const isPinned = await window.adpilot.toggleAlwaysOnTop();
      if (isPinned) {
        btnPin.classList.add('active-pin');
        btnPin.title = 'Desafixar Janela (Janela fixada no topo)';
      } else {
        btnPin.classList.remove('active-pin');
        btnPin.title = 'Fixar Copiloto no Topo (Trabalhe com o AdPilot ao lado do Chrome)';
      }
    }
  });

  let splitState = 0;
  btnToggleSplit?.addEventListener('click', () => {
    splitState = (splitState + 1) % 3;
    if (splitState === 0) {
      panelBrowser.style.flex = '6';
      panelCopilot.style.display = 'flex';
      panelCopilot.style.flex = '4';
    } else if (splitState === 1) {
      panelBrowser.style.flex = '1';
      panelCopilot.style.display = 'none';
    } else {
      panelBrowser.style.flex = '3';
      panelCopilot.style.display = 'flex';
      panelCopilot.style.flex = '7';
    }
  });
}

function navigateTo(url) {
  if (webview && url) {
    webview.src = url;
    urlInput.value = url;
    highlightActivePreset(url);
  }
}

function highlightActivePreset(url) {
  document.querySelectorAll('.preset-chip').forEach(chip => {
    const chipUrl = chip.getAttribute('data-url');
    if (chipUrl && url.startsWith(chipUrl.replace(/\/$/, ''))) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

// ===================================================================
// 7. Controle de Abas
// ===================================================================
function setupTabs() {
  const tabButtons = document.querySelectorAll('.copilot-tab-btn');
  const tabContents = document.querySelectorAll('.copilot-tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

// ===================================================================
// 8. Chat do Copiloto Media Buyer (com contexto da empresa ativa)
// ===================================================================
function setupChat() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnChatSend = document.getElementById('btn-chat-send');

  const sendMessage = async (userText) => {
    const prompt = (userText || chatInput.value || '').trim();
    if (!prompt) return;

    appendChatMessage('user', prompt);
    chatInput.value = '';

    const activeClient = getActiveClient();
    const clientName = activeClient ? activeClient.name : 'DL MIDIA';
    const loadingBubble = appendChatMessage('ai', `Pensando estrategicamente para ${clientName}...`);

    try {
      const systemInst = SYSTEM_PROMPTS.MEDIA_BUYER + buildClientContext(activeClient);

      const response = await window.adpilot.callGemini({
        apiKey: appState.settings.geminiApiKey,
        model: appState.settings.selectedModel,
        systemInstruction: systemInst,
        prompt: prompt
      });

      if (response.success) {
        loadingBubble.innerHTML = parseMarkdown(response.text);
      } else {
        loadingBubble.innerHTML = `<span style="color: var(--danger);">⚠️ ${response.error}</span>`;
      }
    } catch (err) {
      loadingBubble.innerHTML = `<span style="color: var(--danger);">Erro: ${err.message}</span>`;
    }

    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  btnChatSend?.addEventListener('click', () => sendMessage());
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  document.querySelectorAll('.quick-prompt-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const prompt = pill.getAttribute('data-prompt');
      if (prompt) sendMessage(prompt);
    });
  });
}

function appendChatMessage(role, text) {
  const chatMessages = document.getElementById('chat-messages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role}`;
  bubble.innerHTML = role === 'user' ? escapeHtml(text) : parseMarkdown(text);
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

// ===================================================================
// 9. Auditoria de Perfil do Instagram
// ===================================================================
function setupAudit() {
  const btnFillCurrent = document.getElementById('btn-fill-current-url');
  const auditHandle = document.getElementById('audit-handle');
  const auditNiche = document.getElementById('audit-niche');
  const auditGoal = document.getElementById('audit-goal');
  const auditBio = document.getElementById('audit-bio');
  const btnRunAudit = document.getElementById('btn-run-audit');
  const auditResultBox = document.getElementById('audit-result-box');
  const auditResultContent = document.getElementById('audit-result-content');
  const btnCopyAudit = document.getElementById('btn-copy-audit');

  btnFillCurrent?.addEventListener('click', () => {
    try {
      const currentUrl = webview.getURL();
      if (currentUrl.includes('instagram.com/')) {
        const parts = currentUrl.split('instagram.com/')[1].split('/')[0].split('?')[0];
        if (parts && parts !== 'explore' && parts !== 'direct' && parts !== 'reels') {
          auditHandle.value = '@' + parts;
        }
      }
    } catch (e) {}

    const client = getActiveClient();
    if (client && !auditNiche.value) auditNiche.value = client.niche || '';
  });

  btnRunAudit?.addEventListener('click', async () => {
    const handle = auditHandle.value.trim() || '@perfil';
    const niche = auditNiche.value.trim() || 'Comércio / Serviços';
    const goal = auditGoal.options[auditGoal.selectedIndex].text;
    const bio = auditBio.value.trim();

    btnRunAudit.disabled = true;
    btnRunAudit.innerHTML = '<span>⏳</span> Analisando Perfil...';
    auditResultBox.style.display = 'block';
    auditResultContent.innerHTML = 'Conectando ao modelo de raciocínio de tráfego...';

    const client = getActiveClient();
    const prompt = `Analise este perfil comercial para otimização de tráfego pago e conversão:
- Perfil: ${handle}
- Nicho: ${niche}
- Objetivo Principal: ${goal}
- Bio / Observações: ${bio || 'Não informada detalhadamente.'}
${client ? `- Empresa Vinculada: ${client.name} (Oferta: ${client.offer})` : ''}

Forneça a auditoria em 4 etapas práticas (Diagnóstico UVP, Funil da Bio, Conteúdos com Potencial de Dark Post, Plano de Ação Imediato de Tráfego Pago).`;

    try {
      let resultMarkdown = '';
      if (appState.settings.geminiApiKey) {
        const response = await window.adpilot.callGemini({
          apiKey: appState.settings.geminiApiKey,
          model: appState.settings.selectedModel,
          systemInstruction: SYSTEM_PROMPTS.PROFILE_AUDITOR + buildClientContext(client),
          prompt: prompt
        });
        resultMarkdown = response.success ? response.text : `Erro: ${response.error}`;
      } else {
        resultMarkdown = generateLocalFallback('audit', { handle, niche });
      }

      auditResultContent.innerHTML = parseMarkdown(resultMarkdown);
    } catch (err) {
      auditResultContent.innerHTML = `<span style="color: var(--danger);">Erro na auditoria: ${err.message}</span>`;
    } finally {
      btnRunAudit.disabled = false;
      btnRunAudit.innerHTML = '<span>⚡</span> Executar Auditoria com IA';
    }
  });

  btnCopyAudit?.addEventListener('click', () => {
    copyToClipboard(auditResultContent.innerText, btnCopyAudit, 'Copiado!');
  });
}

// ===================================================================
// 10. Gerador de Criativos & Copy
// ===================================================================
function setupCopyEngine() {
  const btnFillClient = document.getElementById('btn-fill-client-copy');
  const copyProduct = document.getElementById('copy-product');
  const copyAudience = document.getElementById('copy-audience');
  const copyFramework = document.getElementById('copy-framework');
  const copyOffer = document.getElementById('copy-offer');
  const btnGenerateCopy = document.getElementById('btn-generate-copy');
  const copyResultBox = document.getElementById('copy-result-box');
  const copyResultContent = document.getElementById('copy-result-content');
  const btnCopyGenerated = document.getElementById('btn-copy-generated');

  btnFillClient?.addEventListener('click', () => {
    const client = getActiveClient();
    if (client) {
      copyProduct.value = client.offer || client.name;
      copyAudience.value = client.audience || '';
      copyOffer.value = client.goals || 'Condição especial de fechamento';
    }
  });

  btnGenerateCopy?.addEventListener('click', async () => {
    const product = copyProduct.value.trim() || 'Produto / Solução';
    const audience = copyAudience.value.trim() || 'Público comprador qualificado';
    const framework = copyFramework.value;
    const offer = copyOffer.value.trim() || 'Oferta especial';

    btnGenerateCopy.disabled = true;
    btnGenerateCopy.innerHTML = '<span>⏳</span> Criando Anúncios...';
    copyResultBox.style.display = 'block';
    copyResultContent.innerHTML = 'Elaborando ganchos de alta retenção e copies persuasivas...';

    const client = getActiveClient();
    const prompt = `Gere criativos de alta conversão para anúncios da Meta (Instagram/Facebook):
- Produto/Serviço: ${product}
- Público-Alvo & Dores: ${audience}
- Framework Solicitado: ${framework}
- Diferencial & Oferta: ${offer}

Siga rigorosamente a estrutura com 3 Ganchos (0-3s), 2 Copies Primárias, 2 Títulos e o Briefing Visual para Designer/Editor.`;

    try {
      let resultMarkdown = '';
      if (appState.settings.geminiApiKey) {
        const response = await window.adpilot.callGemini({
          apiKey: appState.settings.geminiApiKey,
          model: appState.settings.selectedModel,
          systemInstruction: SYSTEM_PROMPTS.COPY_ENGINE + buildClientContext(client),
          prompt: prompt
        });
        resultMarkdown = response.success ? response.text : `Erro: ${response.error}`;
      } else {
        resultMarkdown = generateLocalFallback('copy', { product, framework });
      }

      copyResultContent.innerHTML = parseMarkdown(resultMarkdown);
    } catch (err) {
      copyResultContent.innerHTML = `<span style="color: var(--danger);">Erro ao gerar: ${err.message}</span>`;
    } finally {
      btnGenerateCopy.disabled = false;
      btnGenerateCopy.innerHTML = '<span>✨</span> Gerar Ganchos, Copies & Briefing';
    }
  });

  btnCopyGenerated?.addEventListener('click', () => {
    copyToClipboard(copyResultContent.innerText, btnCopyGenerated, 'Copiado!');
  });
}

// ===================================================================
// 11. Calculadoras & Métricas de Tráfego
// ===================================================================
function setupCalculators() {
  const calcTicket = document.getElementById('calc-ticket');
  const calcMargin = document.getElementById('calc-margin');
  const calcTargetProfit = document.getElementById('calc-target-profit');

  const resBreakevenRoas = document.getElementById('res-breakeven-roas');
  const resMaxCpa = document.getElementById('res-max-cpa');
  const resTargetCpa = document.getElementById('res-target-cpa');
  const resNetProfit = document.getElementById('res-net-profit');

  const runRoasCalculation = () => {
    const ticket = parseFloat(calcTicket.value) || 0;
    const margin = parseFloat(calcMargin.value) || 0;
    const targetProfit = parseFloat(calcTargetProfit.value) || 0;

    const roasRes = calculateBreakEvenRoas(margin);
    const cpaRes = calculateCpaTargets(ticket, margin, targetProfit);

    resBreakevenRoas.textContent = `${roasRes.breakEvenRoas}x`;
    resMaxCpa.textContent = `R$ ${cpaRes.maxCpa.toFixed(2)}`;
    resTargetCpa.textContent = `R$ ${cpaRes.targetCpa.toFixed(2)}`;
    resNetProfit.textContent = `R$ ${cpaRes.netProfitPerSale.toFixed(2)}`;
  };

  [calcTicket, calcMargin, calcTargetProfit].forEach(input => {
    input?.addEventListener('input', runRoasCalculation);
  });
  runRoasCalculation();

  // Matriz de Decisão: Pausar ou Escalar
  const decSpend = document.getElementById('dec-spend');
  const decConversions = document.getElementById('dec-conversions');
  const decCtr = document.getElementById('dec-ctr');
  const decFreq = document.getElementById('dec-freq');
  const btnEvalDecision = document.getElementById('btn-eval-decision');
  const decisionCard = document.getElementById('decision-result-card');
  const decisionTitle = document.getElementById('decision-result-title');
  const decisionText = document.getElementById('decision-result-text');
  const decisionReasons = document.getElementById('decision-result-reasons');

  btnEvalDecision?.addEventListener('click', () => {
    const ticket = parseFloat(calcTicket.value) || 150;
    const margin = parseFloat(calcMargin.value) || 50;
    const targetProfit = parseFloat(calcTargetProfit.value) || 20;
    const cpaTargets = calculateCpaTargets(ticket, margin, targetProfit);

    const evaluation = evaluateKillOrScale({
      spend: parseFloat(decSpend.value) || 0,
      conversions: parseInt(decConversions.value, 10) || 0,
      targetCpa: cpaTargets.targetCpa || 45,
      ctr: parseFloat(decCtr.value) || 1.5,
      frequency: parseFloat(decFreq.value) || 1.1
    });

    decisionCard.className = `decision-card ${evaluation.badgeClass}`;
    decisionTitle.textContent = evaluation.title;
    decisionText.textContent = evaluation.recommendation;

    decisionReasons.innerHTML = '';
    evaluation.reasons.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      decisionReasons.appendChild(li);
    });

    decisionCard.style.display = 'block';
  });

  // Gerador de UTM
  const utmUrl = document.getElementById('utm-url');
  const utmSource = document.getElementById('utm-source');
  const utmMedium = document.getElementById('utm-medium');
  const utmCampaign = document.getElementById('utm-campaign');
  const btnGenerateUtm = document.getElementById('btn-generate-utm');
  const utmContainer = document.getElementById('utm-output-container');
  const utmFinalUrl = document.getElementById('utm-final-url');
  const btnCopyUtm = document.getElementById('btn-copy-utm');

  btnGenerateUtm?.addEventListener('click', () => {
    const rawUrl = utmUrl.value.trim();
    if (!rawUrl) {
      alert('Informe a URL da página de destino.');
      return;
    }

    const finalUrl = buildUtmUrl({
      baseUrl: rawUrl,
      source: utmSource.value.trim(),
      medium: utmMedium.value.trim(),
      campaign: utmCampaign.value.trim(),
      content: '{{ad.name}}'
    });

    utmFinalUrl.value = finalUrl;
    utmContainer.style.display = 'block';
  });

  btnCopyUtm?.addEventListener('click', () => {
    copyToClipboard(utmFinalUrl.value, btnCopyUtm, 'Link Copiado!');
  });
}

// ===================================================================
// 12. Configurações da API Gemini
// ===================================================================
function setupSettingsUI() {
  const keyInput = document.getElementById('settings-gemini-key');
  const modelSelect = document.getElementById('settings-model');
  const btnSave = document.getElementById('btn-save-settings');
  const btnTest = document.getElementById('btn-test-key');
  const statusBox = document.getElementById('settings-status-box');

  btnSave?.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    const model = modelSelect.value;

    appState.settings.geminiApiKey = key;
    appState.settings.selectedModel = model;

    await persistState();
    updateModelTag();

    statusBox.style.display = 'block';
    statusBox.style.color = 'var(--success)';
    statusBox.textContent = '✓ Configurações salvas localmente com sucesso!';
    setTimeout(() => { statusBox.style.display = 'none'; }, 4000);
  });

  btnTest?.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    btnTest.disabled = true;
    btnTest.textContent = 'Testando...';
    statusBox.style.display = 'block';
    statusBox.style.color = 'var(--text-muted)';
    statusBox.textContent = 'Enviando teste para a Google Gemini API...';

    const res = await window.adpilot.testGeminiKey({ apiKey: key });

    btnTest.disabled = false;
    btnTest.textContent = 'Testar Conexão';

    if (res.success) {
      statusBox.style.color = 'var(--success)';
      statusBox.textContent = '✓ ' + res.message;
    } else {
      statusBox.style.color = 'var(--danger)';
      statusBox.textContent = '✗ ' + res.message;
    }
  });
}

// ===================================================================
// Utilitários de Interface & Markdown
// ===================================================================
function copyToClipboard(text, buttonElement, feedbackText = 'Copiado!') {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = feedbackText;
    setTimeout(() => {
      buttonElement.textContent = originalText;
    }, 2000);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseMarkdown(md) {
  if (!md) return '';

  let html = md;
  html = html.replace(/> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\] ([^\n]+)/g, '<blockquote><strong>$1:</strong> $2</blockquote>');
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/\n\n/g, '<br><br>');

  return html;
}

window.addEventListener('DOMContentLoaded', initApp);
