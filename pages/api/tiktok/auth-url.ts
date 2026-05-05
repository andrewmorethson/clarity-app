// pages/api/tiktok/auth-url.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Não autenticado' })

  const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY
  if (!CLIENT_KEY) return res.status(500).json({ error: 'TikTok não configurado' })

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/tiktok-callback`
  const state = Buffer.from(JSON.stringify({ email: session.user.email, ts: Date.now() })).toString('base64')

  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: 'code',
    scope: 'user.info.basic,user.info.stats,video.list',
    redirect_uri: redirectUri,
    state,
  })

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
  return res.status(200).json({ url: authUrl })
}
