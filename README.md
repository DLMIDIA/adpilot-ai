# 🚀 AdPilot AI — Navegador Integrado & Copiloto para Tráfego Pago

> **O primeiro navegador workspace inteligente com Copiloto de Inteligência Artificial desenhado especificamente para Gestores de Tráfego Pago, Media Buyers e Especialistas em Meta Ads e Instagram.**

Desenvolvido por **Daniel Júnior Barbosa da Silva (DL MIDIA)**.

---

[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue?style=flat-square)](https://electronjs.org)
[![Electron](https://img.shields.io/badge/Electron-v45.0.0-47848F?style=flat-square&logo=electron)](https://www.electronjs.org/)
[![Chromium](https://img.shields.io/badge/Chromium-Engine-4285F4?style=flat-square&logo=googlechrome)](https://chromium.org)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.0%20%2F%202.5-8E75C2?style=flat-square&logo=googlegemini)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📌 Visão Geral do Sistema

O **AdPilot AI** resolve o maior dilema dos profissionais de tráfego pago modernos:
1. **O problema dos bots/scrapers:** Fazer scraping ou automações headless no Meta Ads Manager ou Instagram resulta em checkpoints, CAPTCHAs e bloqueios imediatos de contas de anúncios e BMs.
2. **A solução do AdPilot AI:** Um navegador desktop real baseado em **Chromium Nativo** com partição de sessão persistente (`persist:adpilot_session`). Você faz login legítimo com sua conta da Meta, Instagram e Google Ads uma única vez. Seus cookies, sessões e permissões ficam salvos localmente e seguros.
3. **Copiloto Integrado Lado a Lado:** Enquanto você opera suas campanhas no painel esquerdo, o copiloto com **Google Gemini** ao lado fornece diagnósticos em tempo real, auditorias de contas, cópias persuasivas e cálculos matemáticos de escala.

---

## ✨ Principais Funcionalidades

### 🌐 1. Navegador Chromium Multitarefa com Sessão Persistente
- **Login Seguro e Permanente:** Faça login no Meta Ads Manager, Instagram Web, Meta Business Suite e Google Ads com persistência total de cookies.
- **Atalhos Instantâneos:** Alternância em 1 clique entre o Gerenciador de Anúncios, Biblioteca de Anúncios da Meta (Ad Library), Instagram e Google Ads.
- **Split View Flexível:** Alterne entre visão 60/40, tela cheia do navegador ou tela cheia do copiloto com um único clique (`◫`).

### 🤖 2. Copiloto Media Buyer com Google Gemini
- **Engenharia de Prompt Especializada:** Instruções pré-programadas baseadas nas estratégias de grandes agências de tráfego (Advantage+, CBO vs ABO, funil 3-2-2, testes de criativos semanais).
- **Suporte aos Modelos Modernos:** Compatível com `gemini-2.0-flash`, `gemini-2.5-flash` e `gemini-1.5-pro`.
- **Modo Heurístico Fallback:** Funciona imediatamente com diagnósticos táticos mesmo antes de inserir sua chave de API.

### 🔍 3. Auditoria de Perfil e Conversão (Instagram)
- **Extração com 1 Clique:** Puxa o @handle do perfil aberto no navegador.
- **Diagnóstico do Funil:** Avalia a Proposta Única de Valor (UVP), clareza da Bio, estrutura de destaques de credibilidade e potencial para Dark Posts.
- **Estratégias de Tráfego:** Recomendações práticas para campanhas Click-to-WhatsApp e Click-to-Direct.

### ✍️ 4. Gerador de Criativos de Alta Conversão & Copywriting
- **Frameworks Validados:** AIDA (Atenção, Interesse, Desejo, Ação), PAS (Problema, Agitação, Solução) e Quebra de Padrão.
- **Ganchos de 0-3 Segundos:** Geração de aberturas de alta retenção para Reels, TikTok e vídeos curtos.
- **Briefing Visual:** Direção de arte pronta para entregar ao designer ou editor de vídeo.

### 📊 5. Calculadoras & Matriz de Decisão do Gestor
- **ROAS de Equilíbrio (Break-Even ROAS):** Calcule o ponto de empate e o ROAS necessário para margens líquidas desejadas (15%, 20%, 30%).
- **CPA Alvo & CPA Máximo:** Descubra exatamente quanto você pode pagar por venda/lead antes de ter prejuízo.
- **Matriz "Pausar ou Escalar?" (Kill or Scale):** Diagnóstico automático de anúncios com base em Gasto, Conversões, Frequência e CTR no link.
- **Construtor de UTMs:** Gera URLs rastreáveis com as tags dinâmicas oficiais da Meta (`{{campaign.name}}`, `{{adset.name}}`, `{{ad.name}}`).

---

## 🏗️ Arquitetura do Projeto

```
adpilot-ai/
├── main.js                  # Processo Principal Electron (Sessão Chromium, IPC, Gemini API)
├── preload.js               # Context Bridge seguro (window.adpilot)
├── package.json             # Metadados e scripts de execução
├── run.sh                   # Script executável de inicialização rápida
├── .gitignore               # Ignora node_modules, builds e configs locais
├── src/
│   ├── index.html           # Layout Split View (Chromium Webview + Painel Copiloto)
│   ├── styles.css           # Design Dark Theme moderno (Linear/Arc)
│   ├── renderer.js          # Lógica da interface, eventos e renderização
│   └── services/
│       ├── geminiService.js # Prompts de tráfego pago & Fallback heurístico
│       └── marketingTools.js# Calculadoras de ROAS, CPA, Regras Kill/Scale e UTM
```

---

## 🚀 Como Executar

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **macOS**, **Windows** ou **Linux**

### Passo a Passo

1. **Clone ou acerte a pasta do projeto:**
   ```bash
   cd adpilot-ai
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o AdPilot AI:**
   ```bash
   npm start
   ```
   *Ou no macOS:*
   ```bash
   ./run.sh
   ```

4. **Conecte sua IA (Opcional, porém recomendado):**
   - Acesse a aba **⚙️ Configurações** no painel direito.
   - Insira sua chave gratuita obtida no [Google AI Studio](https://aistudio.google.com/app/apikey).
   - Clique em **Testar Conexão** e pronto!

---

## 📚 Referências & Créditos Open-Source

Este projeto sintetizou e aprimorou conceitos das melhores ferramentas de código aberto do ecossistema de marketing digital e IA:

- **Meta Business Python SDK:** Referência oficial de integração da Meta (`facebook/facebook-python-business-sdk`).
- **Catalogue of API Solutions da Meta:** Casos de uso oficiais de marketing automation (`facebookincubator/catalogue-of-api-solutions`).
- **Pipeboard & Meta Ads Kit:** Algoritmos de regras e monitoramento de campanhas (`indianbill007/pipeboard`, `themattberman/meta-ads-kit`).
- **Instagrapi & MetaAdsCollector:** Lógicas de inspeção de perfis e biblioteca de anúncios (`subzeroid/instagrapi`, `promisingcoder/MetaAdsCollector`).
- **CrewAI & LangChain Social Media Agents:** Arquiteturas de agentes especializados em copywriting e análise de mídia paga.

---

## 👨‍💻 Autor & Direitos

- **Autor:** Daniel Júnior Barbosa da Silva
- **Empresa / Marca:** DL MIDIA
- **Licença:** [MIT License](LICENSE)
