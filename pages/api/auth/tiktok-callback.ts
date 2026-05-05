// pages/api/auth/tiktok-callback.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './[...nextauth]'
import { exchangeCodeForToken, getUserInfo } from '../../../lib/tiktok'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.email) {
    return res.redirect('/login?error=not_authenticated')
  }

  const { code, error } = req.query

  if (error) {
    return res.redirect('/dashboard?error=tiktok_denied')
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/dashboard?error=invalid_code')
  }

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/tiktok-callback`

    // 1. Trocar código por token
    const tokenData = await exchangeCodeForToken(code, redirectUri)

    if (!tokenData?.access_token) {
      return res.redirect('/dashboard?error=token_failed')
    }

    // 2. Buscar dados do perfil TikTok
    const userInfo = await getUserInfo(tokenData.access_token)

    if (!userInfo) {
      return res.redirect('/dashboard?error=userinfo_failed')
    }

    // 3. Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return res.redirect('/dashboard?error=user_not_found')
    }

    // 4. Verificar limite de contas do plano
    const accountCount = await prisma.tikTokAccount.count({
      where: { userId: user.id, isActive: true },
    })

    const planLimits: Record<string, number> = { starter: 1, pro: 5, agency: 20 }
    const limit = planLimits[user.plan] || 1

    if (accountCount >= limit) {
      return res.redirect('/dashboard?error=account_limit')
    }

    // 5. Salvar ou atualizar conta TikTok
    await prisma.tikTokAccount.upsert({
      where: { tiktokUserId: userInfo.open_id },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
        displayName: userInfo.display_name,
        username: userInfo.username,
        isActive: true,
      },
      create: {
        userId: user.id,
        tiktokUserId: userInfo.open_id,
        username: userInfo.username,
        displayName: userInfo.display_name,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    })

    return res.redirect('/dashboard?connected=true')
  } catch (err) {
    console.error('TikTok OAuth error:', err)
    return res.redirect('/dashboard?error=oauth_failed')
  }
}
