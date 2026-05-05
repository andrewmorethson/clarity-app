import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from './[...nextauth]'
import { exchangeCodeForToken, getUserInfo } from '../../../lib/tiktok'

const SUPABASE_URL = 'https://okmmmtzaxcmmcvveqzfc.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbW1tdHpheGNtbWN2dmVxemZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODc1NjUsImV4cCI6MjA5MzU2MzU2NX0.ZGDUCW1HMsX6-fWuwC9XgUCk4m74QKyYTnE0alftS-4'

async function sb(path: string, options: any = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
    ...options,
  })
  const data = await res.json().catch(() => null)
  return { ok: res.ok, status: res.status, data }
}

const PLAN_LIMITS: Record<string, number> = { starter: 1, pro: 5, agency: 20 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.email) return res.redirect('/login?error=not_authenticated')

  const { code, error } = req.query
  if (error) return res.redirect('/dashboard?error=tiktok_denied')
  if (!code || typeof code !== 'string') return res.redirect('/dashboard?error=invalid_code')

  try {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/tiktok-callback`

    // 1. Trocar código por token
    const tokenData = await exchangeCodeForToken(code, redirectUri)
    if (!tokenData?.access_token) return res.redirect('/dashboard?error=token_failed')

    // 2. Buscar dados do perfil TikTok
    const userInfo = await getUserInfo(tokenData.access_token)
    if (!userInfo) return res.redirect('/dashboard?error=userinfo_failed')

    // 3. Buscar usuário no Supabase
    const userResult = await sb(`/users?email=eq.${encodeURIComponent(session.user.email)}&select=id,plan`)
    if (!userResult.ok || !userResult.data?.length) return res.redirect('/dashboard?error=user_not_found')
    const user = userResult.data[0]

    // 4. Verificar limite de contas do plano
    const accountsResult = await sb(`/tiktok_accounts?user_id=eq.${user.id}&is_active=eq.true&select=id`)
    const accountCount = accountsResult.data?.length || 0
    const limit = PLAN_LIMITS[user.plan] || 1
    if (accountCount >= limit) return res.redirect('/dashboard?error=account_limit')

    // 5. Salvar ou atualizar conta TikTok
    const existing = await sb(`/tiktok_accounts?tiktok_user_id=eq.${userInfo.open_id}&select=id`)

    if (existing.ok && existing.data?.length > 0) {
      // Atualizar token existente
      await sb(`/tiktok_accounts?tiktok_user_id=eq.${userInfo.open_id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
          display_name: userInfo.display_name,
          username: userInfo.username,
          is_active: true,
          updated_at: new Date().toISOString(),
        }),
      })
    } else {
      // Criar nova conta
      const id = `acc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      await sb('/tiktok_accounts', {
        method: 'POST',
        body: JSON.stringify({
          id,
          user_id: user.id,
          tiktok_user_id: userInfo.open_id,
          username: userInfo.username || 'unknown',
          display_name: userInfo.display_name || userInfo.username || 'TikTok User',
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || '',
          token_expiry: new Date(Date.now() + (tokenData.expires_in || 86400) * 1000).toISOString(),
          is_active: true,
        }),
      })
    }

    return res.redirect('/dashboard?connected=true')
  } catch (err) {
    console.error('TikTok OAuth error:', err)
    return res.redirect('/dashboard?error=oauth_failed')
  }
}
