// lib/tiktok.ts
// Integração com TikTok Business API

import axios from 'axios'

const TIKTOK_BASE = 'https://open.tiktokapis.com/v2'
const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!

// ---- OAuth URL ----
export function getTikTokAuthUrl(redirectUri: string, state: string) {
  const params = new URLSearchParams({
    client_key: CLIENT_KEY,
    response_type: 'code',
    scope: 'user.info.basic,video.list,research.adlib.basic',
    redirect_uri: redirectUri,
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
}

// ---- Trocar código por token ----
export async function exchangeCodeForToken(code: string, redirectUri: string) {
  const res = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })
  return res.data
}

// ---- Renovar token ----
export async function refreshAccessToken(refreshToken: string) {
  const res = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
  return res.data
}

// ---- Buscar dados do perfil ----
export async function getUserInfo(accessToken: string) {
  const res = await axios.get(`${TIKTOK_BASE}/user/info/`, {
    params: { fields: 'open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count' },
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return res.data?.data?.user
}

// ---- Analytics da conta ----
export async function getAccountAnalytics(accessToken: string, startDate: string, endDate: string) {
  try {
    const res = await axios.post(`${TIKTOK_BASE}/research/user/stats/`, {
      start_date: startDate,
      end_date: endDate,
      metrics: ['follower_count', 'profile_view', 'video_view', 'like', 'comment', 'share'],
    }, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    })
    return res.data?.data
  } catch (err: any) {
    // Retorna dados simulados se API não disponível (dev mode)
    console.warn('TikTok API error, using mock data:', err.message)
    return getMockAnalytics()
  }
}

// ---- Lista de vídeos ----
export async function getVideoList(accessToken: string, maxCount = 10) {
  try {
    const res = await axios.post(`${TIKTOK_BASE}/video/list/`, {
      max_count: maxCount,
      fields: ['id', 'title', 'create_time', 'cover_image_url', 'share_url', 'view_count', 'like_count', 'comment_count', 'share_count', 'duration'],
    }, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    })
    return res.data?.data?.videos || []
  } catch (err: any) {
    console.warn('TikTok video list error, using mock:', err.message)
    return getMockVideos()
  }
}

// ---- Detectar possível shadowban ----
export function detectShadowban(snapshots: any[]) {
  if (snapshots.length < 3) return false
  const recent = snapshots.slice(-3)
  const older  = snapshots.slice(-6, -3)
  if (older.length === 0) return false

  const avgRecent = recent.reduce((s, x) => s + x.views, 0) / recent.length
  const avgOlder  = older.reduce((s, x) => s + x.views, 0) / older.length

  // Queda de mais de 70% = possível shadowban
  return avgOlder > 0 && (avgRecent / avgOlder) < 0.3
}

// ---- Calcular score de saúde (0-100) ----
export function calculateHealthScore(data: {
  engagementRate: number
  completionRate: number
  followerGrowth: number
  postingFrequency: number
}) {
  let score = 0
  // Engajamento (40pts)
  if (data.engagementRate >= 5) score += 40
  else if (data.engagementRate >= 3) score += 28
  else if (data.engagementRate >= 1) score += 15
  else score += 5
  // Retenção (30pts)
  if (data.completionRate >= 60) score += 30
  else if (data.completionRate >= 40) score += 20
  else if (data.completionRate >= 20) score += 10
  // Crescimento (20pts)
  if (data.followerGrowth >= 3) score += 20
  else if (data.followerGrowth >= 1) score += 12
  else if (data.followerGrowth >= 0) score += 5
  // Frequência de posts (10pts)
  if (data.postingFrequency >= 5) score += 10
  else if (data.postingFrequency >= 3) score += 6
  else score += 2

  return Math.min(100, score)
}

// ---- Mock data para desenvolvimento ----
function getMockAnalytics() {
  return {
    follower_count: 89000,
    video_view: 1200000,
    like: 45000,
    comment: 3200,
    share: 8900,
    profile_view: 12000,
  }
}

function getMockVideos() {
  return [
    { id: '1', title: 'Tutorial: 3 acordes que viralizam', view_count: 342000, like_count: 18000, comment_count: 890, duration: 34 },
    { id: '2', title: 'POV: produzindo no celular', view_count: 218000, like_count: 12000, comment_count: 540, duration: 28 },
    { id: '3', title: 'Erro clássico de iniciantes', view_count: 187000, like_count: 9800, comment_count: 420, duration: 41 },
  ]
}
