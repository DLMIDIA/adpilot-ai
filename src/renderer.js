/**
 * AdPilot AI - Renderer Process
 * Gerencia a interface, webview do Chromium, chamadas ao Copiloto IA e ferramentas
 * Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)
 */

import { SYSTEM_PROMPTS, generateLocalFallback } from './services/geminiService.js';
import { 
  calculateBreakEvenRoas, 
  calculateCpaTargets, 
  evaluateKillOrScale, 
  buildUtmUrl 
} from './services/marketingTools.js';

// Estado da Aplicação
let appSettings = {
  geminiApiKey: '',
  selectedModel: 'gemini-2.0-flash',
  theme: 'dark',
  defaultUrl: 'https://adsmanager.facebook.com'
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

// ===================================================================
// 1. Inicialização & Configurações
// ===================================================================
async function initApp() {
  try {
    if (window.adpilot) {
      const saved = await window.adpilot.getSettings();
      if (saved) {
        appSettings = { ...appSettings, ...saved };
        
        // Atualizar inputs da tela de configurações
        const keyInput = document.getElementById('settings-gemini-key');
        const modelSelect = document.getElementById('settings-model');
        if (keyInput) keyInput.value = appSettings.geminiApiKey || '';
        if (modelSelect) modelSelect.value = appSettings.selectedModel || 'gemini-2.0-flash';
        
        updateModelTag();
      }
    }
  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
  }

  setupWebview();
  setupNavigation();
  setupTabs();
  setupChat();
  setupAudit();
  setupCopyEngine();
  setupCalculators();
  setupSettingsUI();
}

function updateModelTag() {
  if (activeModelTag) {
    const model = appSettings.selectedModel || 'gemini-2.0-flash';
    const hasKey = !!(appSettings.geminiApiKey && appSettings.geminiApiKey.trim());
    activeModelTag.textContent = hasKey ? `${model} (Ativo)` : 'Modo Heurístico (Sem API Key)';
    activeModelTag.style.borderColor = hasKey ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)';
  }
}

// ===================================================================
// 2. Controle do Navegador Chromium (Webview)
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
  // Botões de histórico
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

  // Digitar URL e ir
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

  // Chips de Atalho
  document.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const targetUrl = chip.getAttribute('data-url');
      if (targetUrl) navigateTo(targetUrl);
    });
  });

  // Alternar tela dividida
  let splitState = 0; // 0: 60/40, 1: 100/0, 2: 40/60
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
  if (webview) {
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
// 3. Controle de Abas do Copiloto
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
// 4. Chat do Copiloto IA (Media Buyer)
// ===================================================================
function setupChat() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnChatSend = document.getElementById('btn-chat-send');

  const sendMessage = async (userText) => {
    const prompt = (userText || chatInput.value || '').trim();
    if (!prompt) return;

    // Adicionar mensagem do usuário
    appendChatMessage('user', prompt);
    chatInput.value = '';

    // Adicionar placeholder de carregamento da IA
    const loadingBubble = appendChatMessage('ai', 'Pensando na melhor estratégia de tráfego...');

    try {
      if (appSettings.geminiApiKey && appSettings.geminiApiKey.trim()) {
        const response = await window.adpilot.callGemini({
          apiKey: appSettings.geminiApiKey,
          model: appSettings.selectedModel,
          systemInstruction: SYSTEM_PROMPTS.MEDIA_BUYER,
          prompt: prompt
        });

        if (response.success) {
          loadingBubble.innerHTML = parseMarkdown(response.text);
        } else {
          loadingBubble.innerHTML = `<span style="color: var(--danger);">⚠️ ${response.error}</span>`;
        }
      } else {
        // Fallback Heurístico local
        setTimeout(() => {
          loadingBubble.innerHTML = parseMarkdown(
            `> [!NOTE] Copiloto em Modo Heurístico Local (Chave Gemini não configurada).\n\n` +
            `Para responder com raciocínio profundo e análise sob medida para o seu nicho, adicione sua chave nas **Configurações**.\n\n` +
            `**Dica Estratégica Imediata:**\n` +
            `- **Métricas:** Mantenha o foco em CPA e ROAS antes de olhar métricas secundárias.\n` +
            `- **Escala:** Nunca escale mais de 20% do orçamento em menos de 48h no CBO para não resetar o aprendizado da Meta.\n` +
            `- **Criativos:** Se o CTR estiver abaixo de 1%, o problema está no Hook de 3 segundos.`
          );
        }, 500);
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

  // Quick Prompt Pills
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
// 5. Auditoria de Perfil do Instagram
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

  // Preencher perfil atual se a webview estiver no Instagram
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

    const prompt = `Analise este perfil comercial para otimização de tráfego pago e conversão:
- Perfil: ${handle}
- Nicho: ${niche}
- Objetivo Principal: ${goal}
- Bio / Observações: ${bio || 'Não informada detalhadamente, analise o perfil com base nas melhores práticas do nicho.'}

Forneça a auditoria em 4 etapas práticas (Diagnóstico UVP, Funil da Bio, Conteúdos com Potencial de Dark Post, Plano de Ação Imediato de Tráfego Pago).`;

    try {
      let resultMarkdown = '';
      if (appSettings.geminiApiKey && appSettings.geminiApiKey.trim()) {
        const response = await window.adpilot.callGemini({
          apiKey: appSettings.geminiApiKey,
          model: appSettings.selectedModel,
          systemInstruction: SYSTEM_PROMPTS.PROFILE_AUDITOR,
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
// 6. Gerador de Criativos & Copy
// ===================================================================
function setupCopyEngine() {
  const copyProduct = document.getElementById('copy-product');
  const copyAudience = document.getElementById('copy-audience');
  const copyFramework = document.getElementById('copy-framework');
  const copyOffer = document.getElementById('copy-offer');
  const btnGenerateCopy = document.getElementById('btn-generate-copy');
  const copyResultBox = document.getElementById('copy-result-box');
  const copyResultContent = document.getElementById('copy-result-content');
  const btnCopyGenerated = document.getElementById('btn-copy-generated');

  btnGenerateCopy?.addEventListener('click', async () => {
    const product = copyProduct.value.trim() || 'Produto / Solução';
    const audience = copyAudience.value.trim() || 'Público comprador qualificado';
    const framework = copyFramework.value;
    const offer = copyOffer.value.trim() || 'Oferta especial';

    btnGenerateCopy.disabled = true;
    btnGenerateCopy.innerHTML = '<span>⏳</span> Criando Anúncios...';
    copyResultBox.style.display = 'block';
    copyResultContent.innerHTML = 'Elaborando ganchos de alta retenção e copies persuasivas...';

    const prompt = `Gere criativos de alta conversão para anúncios da Meta (Instagram/Facebook):
- Produto/Serviço: ${product}
- Público-Alvo & Dores: ${audience}
- Framework Solicitado: ${framework}
- Diferencial & Oferta: ${offer}

Siga rigorosamente a estrutura com 3 Ganchos (0-3s), 2 Copies Primárias, 2 Títulos e o Briefing Visual para Designer/Editor.`;

    try {
      let resultMarkdown = '';
      if (appSettings.geminiApiKey && appSettings.geminiApiKey.trim()) {
        const response = await window.adpilot.callGemini({
          apiKey: appSettings.geminiApiKey,
          model: appSettings.selectedModel,
          systemInstruction: SYSTEM_PROMPTS.COPY_ENGINE,
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
// 7. Calculadoras & Matriz Kill or Scale
// ===================================================================
function setupCalculators() {
  // Calculadora ROAS & CPA
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
    // Usa o CPA alvo da calculadora acima
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

  // Gerador de UTMs
  const utmUrl = document.getElementById('utm-url');
  const utmSource = document.getElementById('utm-source');
  const utmMedium = document.getElementById('utm-medium');
  const utmCampaign = document.getElementById('utm-campaign');
  const utmContent = document.getElementById('utm-content');
  const btnGenerateUtm = document.getElementById('btn-generate-utm');
  const utmContainer = document.getElementById('utm-output-container');
  const utmFinalUrl = document.getElementById('utm-final-url');
  const btnCopyUtm = document.getElementById('btn-copy-utm');

  btnGenerateUtm?.addEventListener('click', () => {
    const rawUrl = utmUrl.value.trim();
    if (!rawUrl) {
      alert('Por favor, informe a URL da página de destino.');
      return;
    }

    const finalUrl = buildUtmUrl({
      baseUrl: rawUrl,
      source: utmSource.value.trim(),
      medium: utmMedium.value.trim(),
      campaign: utmCampaign.value.trim(),
      content: utmContent.value.trim()
    });

    utmFinalUrl.value = finalUrl;
    utmContainer.style.display = 'block';
  });

  btnCopyUtm?.addEventListener('click', () => {
    copyToClipboard(utmFinalUrl.value, btnCopyUtm, 'Link Copiado!');
  });
}

// ===================================================================
// 8. Tela de Configurações & Teste de Conexão com Google Gemini
// ===================================================================
function setupSettingsUI() {
  const keyInput = document.getElementById('settings-gemini-key');
  const modelSelect = document.getElementById('settings-model');
  const btnSave = document.getElementById('btn-save-settings');
  const btnTest = document.getElementById('btn-test-key');
  const statusBox = document.getElementById('settings-status-box');
  const linkAiStudio = document.getElementById('link-ai-studio');

  linkAiStudio?.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.adpilot) {
      window.adpilot.openExternal('https://aistudio.google.com/app/apikey');
    }
  });

  btnSave?.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    const model = modelSelect.value;

    const res = await window.adpilot.saveSettings({
      geminiApiKey: key,
      selectedModel: model
    });

    if (res.success) {
      appSettings.geminiApiKey = key;
      appSettings.selectedModel = model;
      updateModelTag();

      statusBox.style.display = 'block';
      statusBox.style.color = 'var(--success)';
      statusBox.textContent = '✓ Configurações salvas localmente com sucesso!';
      setTimeout(() => { statusBox.style.display = 'none'; }, 4000);
    } else {
      statusBox.style.display = 'block';
      statusBox.style.color = 'var(--danger)';
      statusBox.textContent = `Erro ao salvar: ${res.error}`;
    }
  });

  btnTest?.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    if (!key) {
      statusBox.style.display = 'block';
      statusBox.style.color = 'var(--warning)';
      statusBox.textContent = 'Insira uma chave antes de testar.';
      return;
    }

    btnTest.disabled = true;
    btnTest.textContent = 'Testando...';
    statusBox.style.display = 'block';
    statusBox.style.color = 'var(--text-muted)';
    statusBox.textContent = 'Enviando ping de teste para a Google Gemini API...';

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
  navigator.clipboard.writeText(text).then(() => {
    const originalText = buttonElement.textContent;
    buttonElement.textContent = feedbackText;
    setTimeout(() => {
      buttonElement.textContent = originalText;
    }, 2000);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseMarkdown(md) {
  if (!md) return '';

  let html = md;

  // Bloco de Callout GitHub
  html = html.replace(/> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\] ([^\n]+)/g, '<blockquote><strong>$1:</strong> $2</blockquote>');

  // Headings
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Code inline
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Listas
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');

  // Quebras de Linha
  html = html.replace(/\n\n/g, '<br><br>');

  return html;
}

// Inicia aplicação após carregamento da janela
window.addEventListener('DOMContentLoaded', initApp);
