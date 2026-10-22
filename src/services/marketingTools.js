/**
 * AdPilot AI - Calculadoras & Matriz de Decisão de Media Buyer
 * Desenvolvido por: Daniel Júnior Barbosa da Silva (DL MIDIA)
 */

/**
 * Calcula o ROAS de Ponto de Equilíbrio (Break-Even ROAS)
 * @param {number} marginPercent - Margem bruta do produto ou serviço (ex: 50 para 50%)
 */
export function calculateBreakEvenRoas(marginPercent) {
  const margin = parseFloat(marginPercent);
  if (!margin || margin <= 0) return { roas: 0, explanation: 'Margem inválida' };

  const breakEvenRoas = 100 / margin;
  const targetRoas15PercentProfit = 100 / Math.max(margin - 15, 1);
  const targetRoas30PercentProfit = 100 / Math.max(margin - 30, 1);

  return {
    breakEvenRoas: parseFloat(breakEvenRoas.toFixed(2)),
    targetRoas15: parseFloat(targetRoas15PercentProfit.toFixed(2)),
    targetRoas30: parseFloat(targetRoas30PercentProfit.toFixed(2)),
    margin
  };
}

/**
 * Calcula o CPA Alvo e CPA Máximo Permitido
 * @param {number} ticketMedio - Preço de venda médio do produto/serviço (R$)
 * @param {number} marginPercent - Margem bruta (%)
 * @param {number} desiredProfitMargin - Margem de lucro líquida desejada após anúncios (%)
 */
export function calculateCpaTargets(ticketMedio, marginPercent, desiredProfitMargin = 15) {
  const ticket = parseFloat(ticketMedio);
  const margin = parseFloat(marginPercent);
  const profitMargin = parseFloat(desiredProfitMargin);

  if (!ticket || !margin) {
    return { maxCpa: 0, targetCpa: 0 };
  }

  // CPA Máximo: O ponto em que o lucro é zero (Break-Even)
  const maxCpa = ticket * (margin / 100);

  // CPA Alvo: Valor ideal para sobrar a margem desejada
  const allowableMarketingPercent = Math.max(margin - profitMargin, 0);
  const targetCpa = ticket * (allowableMarketingPercent / 100);

  return {
    ticket,
    maxCpa: parseFloat(maxCpa.toFixed(2)),
    targetCpa: parseFloat(targetCpa.toFixed(2)),
    netProfitPerSale: parseFloat((ticket * (profitMargin / 100)).toFixed(2))
  };
}

/**
 * Matriz de Decisão do Gestor de Tráfego: PAUSAR (Kill) ou ESCALAR (Scale)
 */
export function evaluateKillOrScale(params) {
  const spend = parseFloat(params.spend || 0);
  const conversions = parseInt(params.conversions || 0, 10);
  const cpa = conversions > 0 ? spend / conversions : parseFloat(params.cpa || 0);
  const targetCpa = parseFloat(params.targetCpa || 0);
  const ctr = parseFloat(params.ctr || 0);
  const cpc = parseFloat(params.cpc || 0);
  const frequency = parseFloat(params.frequency || 1);
  const roas = parseFloat(params.roas || 0);
  const targetRoas = parseFloat(params.targetRoas || 0);

  let status = 'MONITOR'; // MONITOR, SCALE, OPTIMIZE, KILL
  let badgeClass = 'badge-monitor';
  let title = 'Em Aprendizado / Monitoramento';
  let recommendation = '';
  const reasons = [];

  // Regra 1: Sem conversão e gastou pouco (fase de aprendizado)
  if (conversions === 0 && spend < targetCpa * 1.5) {
    status = 'MONITOR';
    badgeClass = 'badge-monitor';
    title = 'Fase de Aprendizado (Deixe Rodar)';
    recommendation = `O conjunto ainda não gastou o suficiente para validar a amostragem. Deixe rodar até atingir pelo menos R$ ${(targetCpa * 1.5).toFixed(2)} gastos antes de tomar decisões.`;
    reasons.push(`Gasto atual (R$ ${spend.toFixed(2)}) é inferior a 1.5x o CPA Alvo (R$ ${(targetCpa * 1.5).toFixed(2)}).`);
  }
  // Regra 2: Sem conversão e já gastou mais de 2x o CPA Alvo
  else if (conversions === 0 && spend >= targetCpa * 2) {
    status = 'KILL';
    badgeClass = 'badge-kill';
    title = '🚨 PAUSAR IMEDIATAMENTE (Kill)';
    recommendation = `O anúncio/conjunto já consumiu mais de 2x o seu CPA Alvo sem gerar nenhuma conversão. Pause imediatamente para estancar prejuízo.`;
    reasons.push(`Gastou R$ ${spend.toFixed(2)} sem conversões (limite era R$ ${(targetCpa * 2).toFixed(2)}).`);
    if (ctr < 1.0) reasons.push(`CTR muito baixo (${ctr}%), indicando que o criativo não chamou a atenção.`);
  }
  // Regra 3: Teve conversões, mas o CPA está muito alto
  else if (conversions > 0 && cpa > targetCpa * 1.35) {
    status = 'KILL';
    badgeClass = 'badge-kill';
    title = '⚠️ PAUSAR OU CORRIGIR OFERTA (CPA Inviável)';
    recommendation = `O CPA atual (R$ ${cpa.toFixed(2)}) está mais de 35% acima da sua meta (R$ ${targetCpa.toFixed(2)}). Se este anúncio for novo, pause. Se for antigo com histórico, reduza 30% do orçamento.`;
    reasons.push(`CPA atual R$ ${cpa.toFixed(2)} vs Alvo R$ ${targetCpa.toFixed(2)}.`);
  }
  // Regra 4: Campanha lucrativa e elegível para escala
  else if (conversions >= 5 && (cpa <= targetCpa || (targetRoas > 0 && roas >= targetRoas))) {
    if (frequency > 2.5) {
      status = 'OPTIMIZE';
      badgeClass = 'badge-optimize';
      title = '🔄 FADIGA DE PÚBLICO (Renovar Criativo)';
      recommendation = `A campanha é lucrativa, mas a frequência (${frequency.toFixed(2)}) está alta. As pessoas estão vendo o anúncio muitas vezes. Crie novos criativos para evitar aumento repentino do CPA.`;
      reasons.push(`Frequência elevada (${frequency.toFixed(2)}).`);
    } else {
      status = 'SCALE';
      badgeClass = 'badge-scale';
      title = '🚀 ESCALAR CAMPANHA (Scale)';
      recommendation = `Campanha com excelente tração! Recomendação de Escala Vertical: Aumente o orçamento diário em +15% a +20% hoje. Recomendação de Escala Horizontal: Duplique o conjunto para novos públicos semelhantes (Lookalike 2% a 5%) ou interesses abertos.`;
      reasons.push(`CPA dentro da meta: R$ ${cpa.toFixed(2)} (Meta: R$ ${targetCpa.toFixed(2)}).`);
      if (roas > 0) reasons.push(`ROAS de ${roas.toFixed(2)}x superando a meta.`);
    }
  }
  // Regra 5: Casos intermediários de otimização
  else {
    status = 'OPTIMIZE';
    badgeClass = 'badge-optimize';
    title = '⚡ OTIMIZAR CRIATIVO / PÚBLICO';
    recommendation = `A campanha está próxima do ponto de equilíbrio, mas pode melhorar. Teste uma nova headline e teste uma variação de gancho nos primeiros 3 segundos.`;
    if (ctr < 1.0) reasons.push(`CTR de ${ctr}% está abaixo da média recomendada de 1.20% a 2.0%.`);
    if (cpc > 2.5) reasons.push(`CPC de R$ ${cpc.toFixed(2)} está acima do ideal para tráfego frio.`);
  }

  return {
    status,
    badgeClass,
    title,
    recommendation,
    reasons,
    metrics: {
      spend,
      conversions,
      cpa: parseFloat(cpa.toFixed(2)),
      targetCpa,
      ctr,
      cpc,
      frequency,
      roas
    }
  };
}

/**
 * Construtor de Parâmetros UTM para Meta Ads
 */
export function buildUtmUrl(params) {
  const { baseUrl, source, medium, campaign, content, term } = params;
  if (!baseUrl) return '';

  let cleanUrl = baseUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  const urlObj = new URL(cleanUrl);
  if (source) urlObj.searchParams.set('utm_source', source);
  if (medium) urlObj.searchParams.set('utm_medium', medium);
  if (campaign) urlObj.searchParams.set('utm_campaign', campaign);
  if (content) urlObj.searchParams.set('utm_content', content);
  if (term) urlObj.searchParams.set('utm_term', term);

  return urlObj.toString();
}
