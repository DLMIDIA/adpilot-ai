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

  POST_SCHEDULER: `Você é um Estrategista de Conteúdo e Tráfego Pago especializado em Roteiros e Postagens de Alto Engajamento para Redes Sociais (Instagram Reels, Carrosséis, Stories e Dark Posts da Meta).
Para a pauta/tema solicitada, gere:
1. 🎣 GANCHO DE 0 A 3 SEGUNDOS (Hook irresistível para prender a atenção nos primeiros segundos de rolagem de tela).
2. 🎬 ROTEIRO / CORPO DO CONTEÚDO (Desenvolvimento rápido, dinâmico e focado em gerar valor e autoridade).
3. 📝 LEGENDA PERSUASIVA (Pronta para publicação, formatada com quebras de linha limpas, emojis e hashtags estratégicas).
4. 🚀 CHAMADA PARA AÇÃO (CTA direcionando para o Direct, WhatsApp ou Link da Bio).`
};

/**
 * Constrói o contexto da empresa/cliente ativo para enriquecer qualquer prompt
 */
export function buildClientContext(client) {
  if (!client) return '';
  return `
[CONTEXTO DO CLIENTE / EMPRESA ATIVA]:
- Nome da Empresa: ${client.name || 'Não informado'}
- Nicho de Atuação: ${client.niche || 'Geral'}
- Oferta Principal / Ticket: ${client.offer || 'Não especificada'}
- Público-Alvo e Dores: ${client.audience || 'Não especificado'}
- Estratégia de Tráfego: ${client.strategy || 'Foco em conversão direta'}
- Metas: ${client.goals || 'CPA baixo e alto ROI'}
- Orientações & Notas: ${client.notes || 'Nenhuma'}
Utilize estritamente esse contexto para personalizar suas respostas, termos e exemplos para este negócio.
`;
}

/**
 * Heurística de Resposta Local (Fallback Inteligente)
 */
export function generateLocalFallback(type, payload = {}) {
  switch (type) {
    case 'audit': {
      const handle = payload.handle || '@perfil';
      const niche = payload.niche || 'Geral';
      return `### 🔍 Auditoria Estratégica do Perfil: ${handle} (Modo Heurístico)

#### 1. Diagnóstico da Proposta Única de Valor (Bio & Header)
- **Posicionamento**: O perfil precisa responder em menos de 3 segundos: *Quem você ajuda? Qual resultado entrega? Como contratar?*
- **Gargalo Típico no Nicho (${niche})**: Bios genéricas sem métricas concretas ou diferenciais claros.
- **Link na Bio**: Evite árvores de links com mais de 3 opções. Foque em 1 ação principal (WhatsApp Direto ou Agendamento).

#### 2. Destaques Essenciais para Tráfego Pago
- **Quem Somos**: Histórico, bastidores e credibilidade da DL MIDIA.
- **Resultados / Depoimentos**: Provas sociais em vídeo aumentam a conversão de tráfego em até 40%.
- **Como Funciona / Oferta**: Explicação sem rodeios do produto ou serviço.

#### 3. Plano de Ação para Tráfego Pago
1. **Campanha de Engajamento para o Direct**: Anúncio em Reels com CTA "Envie 'QUERO' no Direct".
2. **Público Personalizado**: Quem interagiu com o Instagram nos últimos 90 dias.
3. **Público Semelhante (Lookalike 1%)**: Gerar a partir da lista de clientes.`;
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

#### 📝 Copy Primária 1 (Direta & Focada em Dor)
**Atenção:** Você sente que está se esforçando o dobro para ter metade do resultado com ${product}?
**Interesse:** O segredo não é trabalhar mais horas, e sim usar o método validado no mercado.
**Desejo:** Imagine ter previsibilidade, segurança e ver seus resultados crescerem consistentemente.
**Ação:** Toque no botão 'Saiba Mais' abaixo e descubra a condição exclusiva preparada para você hoje.`;
    }

    case 'post': {
      const title = payload.title || 'Conteúdo Estratégico';
      const platform = payload.platform || 'Instagram Reels';
      return `### 📅 Roteiro de Post Gerado: ${title} (${platform})

#### 🎣 Gancho de 0 a 3 Segundos
*"Se você é empresário e ainda não usa essa estratégia no seu negócio, você está perdendo clientes todos os dias para o seu concorrente."*

#### 🎬 Desenvolvimento / Roteiro
- **Cena 1 (3-7s):** Mostre o problema clássico na prática (ex: contas de anúncio desreguladas ou direct vazio).
- **Cena 2 (7-18s):** Explique o mecanismo correto: focar em criativos magnéticos e direcionar o lead para uma conversa 1 a 1 no WhatsApp.
- **Cena 3 (18-25s):** Apresente a solução implementada pela DL MIDIA com previsibilidade de resultados.

#### 📝 Legenda Pronta
Você já percebeu que postar todo dia sem uma estratégia de tráfego pago por trás é como abrir uma loja no meio do deserto? 🏜️

Para vender com consistência, você precisa atrair as pessoas certas na hora certa.

👉 Salve este post para consultar depois e comente "ESCALA" para receber uma análise do seu perfil no Direct!

#trafegopago #metaads #instagramparanegocios #marketingdigital #dlmidia`;
    }

    default:
      return `AdPilot AI Copiloto pronto para ajudar no tráfego pago da sua empresa.`;
  }
}
