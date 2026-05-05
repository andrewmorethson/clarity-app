// lib/claude.ts
// Motor de diagnóstico IA usando Claude (Anthropic)

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

interface AccountData {
  username: string
  followers: number
  views: number
  engagementRate: number
  completionRate: number
  followerGrowthRate: number
  topVideos: { title: string; views: number; duration: number }[]
  postingFrequency: number
  bestHours?: string
  trafficSources?: { fyp: number; followers: number; search: number }
  recentTrend: 'up' | 'down' | 'stable'
  shadowbanSuspected: boolean
  healthScore: number
}

// ---- Diagnóstico principal ----
export async function generateDiagnosis(data: AccountData): Promise<string> {
  const prompt = `
Você é um especialista em TikTok Analytics. Analise os dados abaixo e gere um diagnóstico em português brasileiro, em linguagem simples e direta — sem jargões técnicos.

DADOS DA CONTA @${data.username}:
- Seguidores: ${data.followers.toLocaleString('pt-BR')}
- Views (7 dias): ${data.views.toLocaleString('pt-BR')}
- Taxa de engajamento: ${data.engagementRate}%
- Taxa de conclusão dos vídeos: ${data.completionRate}%
- Crescimento de seguidores: ${data.followerGrowthRate}% (7 dias)
- Frequência de posts: ${data.postingFrequency} posts/semana
- Score de saúde: ${data.healthScore}/100
- Tendência geral: ${data.recentTrend === 'up' ? 'crescendo' : data.recentTrend === 'down' ? 'caindo' : 'estável'}
- Possível shadowban: ${data.shadowbanSuspected ? 'SIM — alcance drasticamente reduzido' : 'Não'}
- Top vídeos: ${data.topVideos.map(v => `"${v.title}" (${v.views.toLocaleString('pt-BR')} views, ${v.duration}s)`).join(', ')}
${data.trafficSources ? `- Origem do tráfego: FYP ${data.trafficSources.fyp}%, Seguidores ${data.trafficSources.followers}%, Busca ${data.trafficSources.search}%` : ''}
${data.bestHours ? `- Melhores horários históricos: ${data.bestHours}` : ''}

Gere um diagnóstico com EXATAMENTE esta estrutura JSON (sem markdown, só JSON puro):
{
  "resumo": "2-3 frases resumindo a situação geral da conta de forma humana",
  "insights": [
    {
      "tipo": "positivo|atencao|oportunidade|critico",
      "titulo": "Título curto e direto",
      "descricao": "Explicação em 1-2 frases simples",
      "acao": "O que fazer agora em 1 frase"
    }
  ],
  "melhorHorario": "Ex: Terças e quintas às 19h–20h",
  "formatoIdeal": "Ex: Vídeos de 28–45 segundos",
  "proximaAcao": "A coisa mais importante a fazer AGORA em 1 frase"
}

Regras:
- Máximo 4 insights
- Linguagem de WhatsApp, não de relatório corporativo
- Se shadowban for suspeito, coloque como insight crítico
- Seja específico com os números
`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'

  // Limpa possíveis ```json``` do response
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
}

// ---- Checar elegibilidade Creator Rewards ----
export function checkCreatorRewards(data: {
  followers: number
  views30days: number
  accountAgeDays: number
  hasViolations: boolean
  isCreatorAccount: boolean
  videos60sCount: number
}) {
  const requirements = [
    {
      key: 'followers',
      label: 'Seguidores mínimos',
      required: 10000,
      current: data.followers,
      met: data.followers >= 10000,
    },
    {
      key: 'views',
      label: 'Views nos últimos 30 dias',
      required: 100000,
      current: data.views30days,
      met: data.views30days >= 100000,
    },
    {
      key: 'age',
      label: 'Conta com +30 dias',
      required: 30,
      current: data.accountAgeDays,
      met: data.accountAgeDays >= 30,
    },
    {
      key: 'violations',
      label: 'Sem violações de diretrizes',
      required: 0,
      current: data.hasViolations ? 1 : 0,
      met: !data.hasViolations,
    },
    {
      key: 'account_type',
      label: 'Conta Creator ou Business',
      required: 1,
      current: data.isCreatorAccount ? 1 : 0,
      met: data.isCreatorAccount,
    },
  ]

  const metCount = requirements.filter(r => r.met).length
  const progress = Math.round((metCount / requirements.length) * 100)

  return { requirements, progress, eligible: progress === 100 }
}

// ---- Estimar receita ----
export function estimateRevenue(followers: number, views: number, niche: string) {
  // Creator Rewards: ~R$0,003 a R$0,005 por view (estimativa BR)
  const creatorRewards = {
    min: Math.round(views * 0.003),
    max: Math.round(views * 0.005),
  }

  // Brand deals baseado em seguidores
  const brandDeal = followers < 10000
    ? { min: 200, max: 600 }
    : followers < 50000
    ? { min: 600, max: 2000 }
    : followers < 100000
    ? { min: 1200, max: 3500 }
    : { min: 3500, max: 10000 }

  return { creatorRewards, brandDeal }
}
