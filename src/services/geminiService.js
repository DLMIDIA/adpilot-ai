/**
 * AdPilot AI - Gemini Service & Prompts de Engenharia de Tráfego Pago
 * Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)
 */

export const SYSTEM_PROMPTS = {
  MEDIA_BUYER: `Você é o AdPilot AI, um Media Buyer Sênior e Especialista em Tráfego Pago de classe mundial, com foco em Meta Ads (Facebook & Instagram Ads), Google Ads e estratégias de conversão.
Sua comunicação é direta, analítica, estratégica e altamente orientada a ROI, ROAS e LTV.
Você domina:
- Estruturas de contas modernas (Advantage+ Shopping / Leads, CBO vs ABO).
- Funil completo: Topo (Atração/Vídeos Curtos), Meio (Nutrição/Autoridade) e Fundo (Conversão direta/Remarketing/Direct).
- Análise de métricas primárias (ROAS, CPA, Conversões, Faturamento) e secundárias (CTR no link, CPC, CPM, Frequência, Hook Rate de 3s).
- Diagnóstico de contingência, esteira de criativos e esteira de testes semanais.
Responda sempre em português brasileiro de forma organizada, usando tópicos, tabelas ou checklists acionáveis.`,

  PROFILE_AUDITOR: `Você é um Auditor Sênior de Perfis de Instagram focado em Conversão e Vendas para Tráfego Pago.
Sua missão é analisar perfis comerciais de clientes ou concorrentes e extrair:
1. Diagnóstico da Proposta Única de Valor (UVP na Bio e Foto de Perfil).
2. Análise do Funil de Conversão (Link da bio, Destaques estratégicos como Quem Sou, Prova Social, Oferta, Depoimentos).
3. Avaliação de Conteúdo e Ganchos para Tráfego Orgânico -> Tráfego Pago (Reels e Carrosséis que viram Dark Posts).
4. Recomendações práticas para rodar campanhas para o Direct (Click-to-Direct/WhatsApp) e conversão em leads.
Seja cirúrgico: aponte o que está bom, o que está drenando vendas e qual é o plano de ação imediato de 3 passos.`,

  COPY_ENGINE: `Você é um Copywriter Direto Sênior especializado em Anúncios de Alta Conversão para Instagram e Meta Ads.
Você domina as estruturas:
- AIDA (Atenção, Interesse, Desejo, Ação)
- PAS (Problema, Agitação, Solução)
- Quebra de Padrão (Pattern Interrupt & Ganchos Visuais de 0-3 segundos)
- Storytelling Emocional
Para qualquer oferta fornecida, gere sempre:
1. Três Ganchos de Abertura (0-3 segundos para vídeo ou 1ª linha do texto).
2. Duas Variações de Copy Primária (uma curta e direta, outra mais persuasiva e detalhada).
3. Duas Sugestões de Título (Headlines de até 40 caracteres com gatilhos de urgência/curiosidade).
4. Briefing Visual / Direção de Arte para o criativo (o que mostrar na tela).
5. Chamada para Ação (CTA clara).`,

  COMPETITOR_SPY: `Você é um Engenheiro Reverso de Criativos de Tráfego Pago e Espião da Biblioteca de Anúncios da Meta (Ad Library).
Sua função é dissecar anúncios de concorrentes e revelar:
- Qual é o Mecanismo Único e a Promessa Central.
- Qual dor ou ambição do público-alvo está sendo explorada.
- Por que esse criativo provavelmente está escalando (tempo ativo na biblioteca, variações de formato).
- Como modelar eticamente e criar uma versão SUPERIOR para a nossa marca sem copiar.`
};

/**
 * Heurística de Resposta Local (Fallback Inteligente quando a API Key ainda não foi inserida)
 */
export function generateLocalFallback(type, payload = {}) {
  switch (type) {
    case 'audit': {
      const handle = payload.handle || '@perfil';
      const niche = payload.niche || 'Geral';
      return `### 🔍 Auditoria Estratégica do Perfil: ${handle} (Modo Heurístico)
> [!NOTE] Dica: Para análises em tempo real com deep reasoning, adicione sua chave do Google Gemini nas Configurações.

#### 1. Diagnóstico da Proposta Única de Valor (Bio & Header)
- **Posicionamento**: O perfil precisa responder em menos de 3 segundos: *Quem você ajuda? Qual resultado entrega? Como contratar?*
- **Gargalo Típico no Nicho (${niche})**: Bios genéricas ("Ajudamos você a crescer") sem métricas concretas ou diferenciais claros.
- **Link na Bio**: Evite árvores de links com mais de 3 opções. Foque em 1 ação principal (ex: WhatsApp Direto ou Agendamento).

#### 2. Destaques Essenciais para Tráfego Pago
- **Quem Somos**: Histórico, bastidores e credibilidade.
- **Resultados / Depoimentos**: Provas sociais em vídeo aumentam a conversão de tráfego em até 40%.
- **Como Funciona / Oferta**: Explicação sem rodeios do produto ou serviço.

#### 3. Plano de Ação para Tráfego Pago
1. **Campanha de Engajamento para o Direct**: Rodar anúncio em Reels com CTA "Envie 'QUERO' no Direct" para iniciar conversas com leads qualificados.
2. **Público Personalizado (Custom Audience)**: Criar público de quem interagiu com o Instagram nos últimos 90 dias e rodar anúncio de oferta direta.
3. **Público Semelhante (Lookalike 1%)**: Gerar público semelhante da lista de clientes ou quem enviou mensagem nos últimos 30 dias.`;
    }

    case 'copy': {
      const product = payload.product || 'Produto/Serviço';
      const framework = payload.framework || 'AIDA';
      return `### ✍️ Criativos de Alta Conversão — Estrutura ${framework}
**Produto/Oferta:** ${product}

---

#### 🎣 3 Ganchos de 0 a 3 Segundos (Reels / Stories / Vídeo)
1. *"O maior erro que 90% das pessoas cometem ao tentar ${product} (e você provavelmente faz isso)..."*
2. *"Se você ainda faz isso para ter resultados, você está literalmente rasgando dinheiro todo mês."*
3. *"Pare de complicar: esse é o passo a passo exato que você precisa para dominar ${product} hoje."*

---

#### 📝 Copy Primária 1 (Direta & Focada em Dor - AIDA)
**Atenção:** Você sente que está se esforçando o dobro para ter metade do resultado com ${product}?
**Interesse:** O segredo não é trabalhar mais horas, e sim usar o método certo validado no mercado.
**Desejo:** Imagine ter previsibilidade, segurança e ver seus resultados crescerem consistentemente toda semana.
**Ação:** Toque no botão 'Saiba Mais' abaixo e descubra a condição exclusiva preparada para você hoje.

---

#### 📌 Títulos (Headlines para o Botão do Anúncio)
- **Opção 1:** Domine ${product} de Forma Prática
- **Opção 2:** Vagas Limitadas — Comece Agora

---

#### 🎨 Briefing Visual para Designer / Editor
- **Cena 1 (0-3s):** Pessoa frustrada na tela com expressão séria ou texto grande com fundo amarelo piscando.
- **Cena 2 (3-8s):** Demonstração visual do método / bastidores da solução.
- **Cena 3 (8-15s):** Depoimentos rápidos na tela + CTA com seta apontando para o botão do anúncio.`;
    }

    case 'spy': {
      const term = payload.term || 'Anúncio Concorrente';
      return `### 🕵️ Análise de Espionagem de Anúncio: ${term}
- **Promessa:** Oferta com forte alavancagem de tempo ou redução de custo.
- **Formato:** Vídeo vertical estilo UGC (User Generated Content) gravado em smartphone. Vídeos mais naturais geram até 3x mais CTR que produções corporativas estáticas.
- **Ponto Forte:** O gancho nos primeiros 2 segundos prende a atenção antes de mencionar a marca.
- **Como Superar:** Produzir um criativo com gancho similar, porém inserindo um comparativo lado a lado e uma garantia incondicional mais forte.`;
    }

    default:
      return `AdPilot AI Copiloto pronto para ajudar no tráfego pago da sua empresa. Digite sua dúvida ou selecione uma ferramenta acima.`;
  }
}
