// pages/api/diagnosis/[accountId].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { PrismaClient } from '@prisma/client'
import { generateDiagnosis, checkCreatorRewards, estimateRevenue } from '../../../lib/claude'
import { getAccountAnalytics, getVideoList, detectShadowban, calculateHealthScore } from '../../../lib/tiktok'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Não autenticado' })

  const { accountId } = req.query

  try {
    // 1. Buscar conta
    const account = await prisma.tikTokAccount.findFirst({
      where: {
        id: accountId as string,
        user: { email: session.user.email! },
      },
      include: {
        snapshots: { orderBy: { date: 'desc' }, take: 10 },
      },
    })

    if (!account) return res.status(404).json({ error: 'Conta não encontrada' })

    // 2. Verificar token expirado
    if (account.tokenExpiry < new Date()) {
      return res.status(401).json({ error: 'token_expired', message: 'Token TikTok expirado. Reconecte a conta.' })
    }

    // 3. Buscar dados frescos da API TikTok
    const [analytics, videos] = await Promise.all([
      getAccountAnalytics(account.accessToken, getDateDaysAgo(7), getToday()),
      getVideoList(account.accessToken, 5),
    ])

    // 4. Calcular métricas
    const engagementRate = analytics.video_view > 0
      ? parseFloat(((analytics.like + analytics.comment + analytics.share) / analytics.video_view * 100).toFixed(2))
      : 0

    const shadowbanSuspected = detectShadowban(account.snapshots)

    const healthScore = calculateHealthScore({
      engagementRate,
      completionRate: 65, // TODO: buscar da API quando disponível
      followerGrowth: 2.5,
      postingFrequency: 4,
    })

    // 5. Gerar diagnóstico com Claude
    const diagnosisRaw = await generateDiagnosis({
      username: account.username,
      followers: analytics.follower_count || 0,
      views: analytics.video_view || 0,
      engagementRate,
      completionRate: 65,
      followerGrowthRate: 2.5,
      topVideos: videos.map((v: any) => ({
        title: v.title || 'Sem título',
        views: v.view_count || 0,
        duration: v.duration || 30,
      })),
      postingFrequency: 4,
      recentTrend: 'up',
      shadowbanSuspected,
      healthScore,
    })

    let diagnosis
    try {
      diagnosis = JSON.parse(diagnosisRaw)
    } catch {
      diagnosis = { resumo: diagnosisRaw, insights: [], proximaAcao: '' }
    }

    // 6. Verificar elegibilidade Creator Rewards
    const creatorRewards = checkCreatorRewards({
      followers: analytics.follower_count || 0,
      views30days: analytics.video_view || 0,
      accountAgeDays: 365,
      hasViolations: false,
      isCreatorAccount: true,
      videos60sCount: 4,
    })

    // 7. Estimar receita
    const revenueEstimate = estimateRevenue(
      analytics.follower_count || 0,
      analytics.video_view || 0,
      'geral'
    )

    // 8. Salvar snapshot
    await prisma.snapshot.create({
      data: {
        accountId: account.id,
        followers: analytics.follower_count || 0,
        views: analytics.video_view || 0,
        likes: analytics.like || 0,
        comments: analytics.comment || 0,
        shares: analytics.share || 0,
        engagementRate,
        completionRate: 65,
      },
    })

    // 9. Criar alerta se shadowban detectado
    if (shadowbanSuspected) {
      await prisma.alert.create({
        data: {
          userId: account.userId,
          accountId: account.id,
          type: 'shadowban',
          severity: 'critical',
          title: `@${account.username} — Possível shadowban detectado`,
          message: 'Alcance orgânico caiu mais de 70% em 3 dias. Verifique se algum vídeo recente violou diretrizes.',
        },
      })
    }

    return res.status(200).json({
      account: { username: account.username, displayName: account.displayName },
      analytics: { ...analytics, engagementRate, healthScore, shadowbanSuspected },
      videos,
      diagnosis,
      creatorRewards,
      revenueEstimate,
    })
  } catch (err) {
    console.error('Diagnosis error:', err)
    return res.status(500).json({ error: 'Erro interno ao gerar diagnóstico' })
  }
}

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getDateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
